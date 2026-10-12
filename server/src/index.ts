import express from 'express'
import { createServer } from 'http'
import https from 'https'
import { Server } from 'socket.io'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import { URL } from 'url'
import path from 'path'
import fs from 'fs'
import { store } from './store'
import { tickActiveRelayers, awardFirstRelay, awardRelayRequest } from './scoring'
import { startProxyServer } from './proxy'
import http from 'http'
import { BrowserState } from './types'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

app.set('trust proxy', 1)
app.use(cors())
app.use(express.json())

const TEAM_COLORS = [
  '#00FF88', '#00B4FF', '#FF6B35', '#FF3CAC', '#FFD23F', '#7C3AED',
  '#06B6D4', '#F59E0B', '#EF4444', '#10B981',
]

const ALLOWED_DOMAINS = [
  'free.telecom5g.com',
  'cdn.tera5g.net',
  'updates.carrier.ng',
  'streaming.telecom5g.com',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function broadcastScores() {
  io.emit('scores', store.getAllScores())
}

function broadcastActive() {
  const now = Date.now()
  const active = store.getActiveTeamIds().map(teamId => {
    const team = store.getTeam(teamId)
    const score = store.scores.get(teamId)
    return {
      teamId,
      teamName: team?.name ?? 'Unknown',
      teamColor: team?.color ?? '#fff',
      lastSeen: store.teamActivity.get(teamId) ?? now,
      activeSeconds: score?.activeSeconds ?? 0,
      requestCount: score?.connectionsAllowed ?? 0,
    }
  })
  io.emit('active_sessions', active)
}

// ── Teams ─────────────────────────────────────────────────────────────────────

app.post('/api/teams', (req, res) => {
  const { name } = req.body as { name?: string }
  if (!name?.trim()) return res.status(400).json({ error: 'Team name required' })

  for (const t of store.teams.values()) {
    if (t.name.toLowerCase() === name.trim().toLowerCase()) {
      return res.json({ team: t, existed: true })
    }
  }

  const id = uuidv4()
  const color = TEAM_COLORS[store.teams.size % TEAM_COLORS.length]
  const team = { id, name: name.trim(), color, createdAt: Date.now() }
  store.teams.set(id, team)
  store.ensureScore(team)

  io.emit('team_joined', team)
  broadcastScores()
  return res.json({ team, existed: false })
})

app.get('/api/teams', (_req, res) => {
  res.json(Array.from(store.teams.values()))
})

// ── Real relay — this IS the domain fronting bypass ───────────────────────────
//
//  Device connects to THIS server (the "allowed" SNI endpoint on the network).
//  It passes the real target hostname as the Host / query param.
//  In vulnerable mode → server fetches and returns the real content.
//  In patched mode   → server detects the SNI/Host mismatch and blocks.
//
//  Traffic flow:
//    Device → [firewall sees: tera5g-server] → Proxy/Relay → [actual target]
//
// ──────────────────────────────────────────────────────────────────────────────

function injectBase(html: string, origin: string): string {
  const base = `<base href="${origin}/">`
  if (html.includes('<head>')) return html.replace('<head>', `<head>${base}`)
  if (html.includes('<HEAD>')) return html.replace('<HEAD>', `<HEAD>${base}`)
  return base + html
}

app.get('/api/relay', (req, res) => {
  const { url, teamId } = req.query as { url?: string; teamId?: string }
  if (!url || !teamId) return res.status(400).json({ error: 'url and teamId required' })

  const team = store.getTeam(teamId)
  if (!team) return res.status(403).json({ error: 'Invalid teamId' })

  let targetUrl: URL
  try { targetUrl = new URL(url) } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  const hostname = targetUrl.hostname
  const score = store.ensureScore(team)
  score.connectionsAttempted++

  // ── Patched mode: SNI/Host mismatch detected ──────────────────────────────
  if (store.firewallMode === 'patched') {
    const entry = {
      id: uuidv4(),
      timestamp: Date.now(),
      teamId: team.id,
      teamName: team.name,
      teamColor: team.color,
      sni: 'tera5g-server',
      hostHeader: hostname,
      ja3Hash: 'n/a',
      decision: {
        allowed: false,
        mode: 'patched' as const,
        reason: `SNI/Host correlation blocked: SNI=tera5g-server ≠ Host=${hostname}`,
        detectedSpoofing: true,
        sniMismatch: true,
      },
    }
    store.trafficLog.push(entry)
    if (store.trafficLog.length > 1000) store.trafficLog.shift()
    io.emit('traffic', entry)
    broadcastScores()

    res.status(403).set('Content-Type', 'text/html').send(`
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Blocked</title>
<style>body{background:#050b14;color:#c8d8f0;font-family:monospace;
display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.c{border:1px solid #ff444440;background:#0d1526;border-radius:12px;padding:32px;max-width:440px;width:100%;margin:16px}
h1{color:#ff4444;margin:0 0 16px}p{color:#8090b0;font-size:13px;line-height:1.6}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1a2840;font-size:12px}
.l{color:#4a5c7a}.r{color:#c8d8f0}</style></head>
<body><div class="c"><h1>⛔ 403 — Connection Blocked</h1>
<div class="row"><span class="l">Target</span><span class="r">${hostname}</span></div>
<div class="row"><span class="l">Firewall</span><span style="color:#00ff88">PATCHED</span></div>
<div class="row"><span class="l">Detection</span><span style="color:#ff4444">SNI/Host mismatch</span></div>
<div class="row"><span class="l">SNI</span><span class="r">tera5g-server</span></div>
<div class="row"><span class="l">Host header</span><span style="color:#ff4444">${hostname}</span></div>
<p style="margin-top:16px">Tera5G Firewall patched — SNI/Host correlation active. Domain fronting detected and blocked.</p>
</div></body></html>`)
    return
  }

  // ── Vulnerable mode: domain fronting succeeds — proxy the real request ────
  const protocol = targetUrl.protocol === 'https:' ? https : http
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port ? parseInt(targetUrl.port) : (targetUrl.protocol === 'https:' ? 443 : 80),
    path: targetUrl.pathname + (targetUrl.search || ''),
    method: 'GET',
    headers: {
      'Host': targetUrl.host,
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'identity',
      'Connection': 'close',
    },
    timeout: 15000,
  }

  const proxyReq = (protocol as typeof https).request(options, proxyRes => {
    // Follow redirects
    if (
      proxyRes.statusCode &&
      proxyRes.statusCode >= 300 &&
      proxyRes.statusCode < 400 &&
      proxyRes.headers.location
    ) {
      try {
        const redir = new URL(proxyRes.headers.location, url)
        const relayRedir = `/api/relay?teamId=${teamId}&url=${encodeURIComponent(redir.href)}`
        res.redirect(relayRedir)
      } catch {
        res.status(502).send('Bad redirect')
      }
      return
    }

    const ct = proxyRes.headers['content-type'] ?? 'application/octet-stream'

    // Strip headers that block iframe embedding
    delete proxyRes.headers['x-frame-options']
    delete proxyRes.headers['content-security-policy']
    delete proxyRes.headers['content-security-policy-report-only']
    delete proxyRes.headers['x-content-type-options']

    if (ct.includes('text/html')) {
      let body = ''
      proxyRes.setEncoding('utf8')
      proxyRes.on('data', chunk => { body += chunk })
      proxyRes.on('end', () => {
        const patched = injectBase(body, targetUrl.origin)

        const entry = {
          id: uuidv4(),
          timestamp: Date.now(),
          teamId: team.id,
          teamName: team.name,
          teamColor: team.color,
          sni: 'tera5g-server',
          hostHeader: hostname,
          ja3Hash: 'proxy-relay',
          decision: {
            allowed: true,
            mode: 'vulnerable' as const,
            reason: `Domain fronting: device→tera5g-server→${hostname} (firewall saw only tera5g-server)`,
          },
          bytes: Buffer.byteLength(patched, 'utf8'),
        }
        store.trafficLog.push(entry)
        if (store.trafficLog.length > 1000) store.trafficLog.shift()
        io.emit('traffic', entry)

        store.teamActivity.set(team.id, Date.now())
        awardRelayRequest(team.id)
        awardFirstRelay(team.id)
        broadcastScores()
        broadcastActive()

        res.status(proxyRes.statusCode ?? 200)
          .set('Content-Type', 'text/html; charset=utf-8')
          .set('X-Tera5G-Via', `tunnel:${hostname}`)
          .set('X-Frame-Options', 'ALLOWALL')
          .send(patched)
      })
    } else {
      // Binary/CSS/JS — pipe directly
      res.status(proxyRes.statusCode ?? 200)
        .set('Content-Type', ct)
        .set('X-Tera5G-Via', `tunnel:${hostname}`)
      proxyRes.pipe(res, { end: true })
    }
  })

  proxyReq.on('timeout', () => {
    proxyReq.destroy()
    if (!res.headersSent) res.status(504).send('Gateway Timeout')
  })

  proxyReq.on('error', err => {
    if (!res.headersSent) res.status(502).send(`Bad Gateway: ${err.message}`)
  })

  proxyReq.end()
})

// ── Firewall control ──────────────────────────────────────────────────────────

app.get('/api/firewall', (_req, res) => {
  res.json({ mode: store.firewallMode, allowedDomains: ALLOWED_DOMAINS })
})

app.post('/api/firewall/mode', (req, res) => {
  const { mode, adminKey } = req.body as { mode?: string; adminKey?: string }
  if (adminKey !== store.adminKey) return res.status(403).json({ error: 'Invalid admin key' })
  if (mode !== 'vulnerable' && mode !== 'patched') return res.status(400).json({ error: 'Invalid mode' })

  store.firewallMode = mode

  if (mode === 'patched') {
    store.teamActivity.clear() // end all active sessions
    io.emit('firewall_patched', {
      message: 'Firewall PATCHED — SNI/Host correlation active. All domain-fronting relays are now blocked.',
    })
  } else {
    io.emit('firewall_vulnerable', {
      message: 'Firewall set to VULNERABLE — SNI-only inspection. Domain fronting bypass is open.',
    })
  }

  io.emit('firewall_mode', mode)
  broadcastScores()
  broadcastActive()
  return res.json({ mode })
})

// ── Scores ────────────────────────────────────────────────────────────────────

app.get('/api/scores', (_req, res) => res.json(store.getAllScores()))
app.get('/api/status', (_req, res) => res.json({
  firewallMode: store.firewallMode,
  activeTeams: store.getActiveTeamIds().length,
  teams: store.teams.size,
  traffic: store.trafficLog.length,
}))

// ── Admin browser management ──────────────────────────────────────────────────

app.post('/api/admin/push-url', (req, res) => {
  const { adminKey, teamId, url } = req.body as { adminKey?: string; teamId?: string; url?: string }
  if (adminKey !== store.adminKey) return res.status(403).json({ error: 'Invalid admin key' })
  if (!url) return res.status(400).json({ error: 'url required' })
  if (teamId) {
    const socketId = store.teamSockets.get(teamId)
    if (!socketId) return res.status(404).json({ error: 'Team browser not connected' })
    io.to(socketId).emit('admin:push_url', { url })
  } else {
    io.emit('admin:push_url', { url })
  }
  return res.json({ ok: true })
})

app.post('/api/admin/announce', (req, res) => {
  const { adminKey, teamId, message, type = 'info' } = req.body as {
    adminKey?: string; teamId?: string; message?: string; type?: string
  }
  if (adminKey !== store.adminKey) return res.status(403).json({ error: 'Invalid admin key' })
  if (!message) return res.status(400).json({ error: 'message required' })
  const payload = { message, type }
  if (teamId) {
    const socketId = store.teamSockets.get(teamId)
    if (socketId) io.to(socketId).emit('admin:announce', payload)
  } else {
    io.emit('admin:announce', payload)
  }
  return res.json({ ok: true })
})

app.post('/api/admin/kick', (req, res) => {
  const { adminKey, teamId } = req.body as { adminKey?: string; teamId?: string }
  if (adminKey !== store.adminKey) return res.status(403).json({ error: 'Invalid admin key' })
  if (!teamId) return res.status(400).json({ error: 'teamId required' })
  const socketId = store.teamSockets.get(teamId)
  if (socketId) io.to(socketId).emit('admin:kicked', { message: 'You have been removed by the admin.' })
  store.teams.delete(teamId)
  store.scores.delete(teamId)
  store.teamActivity.delete(teamId)
  store.browserStates.delete(teamId)
  store.teamSockets.delete(teamId)
  if (socketId) store.socketTeams.delete(socketId)
  broadcastScores()
  broadcastActive()
  io.emit('browser_states', store.getAllBrowserStates())
  io.emit('team_kicked', { teamId })
  return res.json({ ok: true })
})

app.post('/api/admin/reset-scores', (req, res) => {
  const { adminKey, teamId } = req.body as { adminKey?: string; teamId?: string }
  if (adminKey !== store.adminKey) return res.status(403).json({ error: 'Invalid admin key' })
  if (teamId) {
    const team = store.getTeam(teamId)
    if (!team) return res.status(404).json({ error: 'Team not found' })
    store.scores.set(teamId, {
      teamId, teamName: team.name, color: team.color,
      totalPoints: 0, activeSeconds: 0, connectionsAttempted: 0,
      connectionsAllowed: 0, longestSession: 0, firstConnectBonus: false,
    })
  } else {
    store.firstRelayTeamId = null
    for (const [id, team] of store.teams.entries()) {
      store.scores.set(id, {
        teamId: id, teamName: team.name, color: team.color,
        totalPoints: 0, activeSeconds: 0, connectionsAttempted: 0,
        connectionsAllowed: 0, longestSession: 0, firstConnectBonus: false,
      })
    }
  }
  broadcastScores()
  return res.json({ ok: true })
})

app.post('/api/admin/lock', (req, res) => {
  const { adminKey, teamId, locked } = req.body as {
    adminKey?: string; teamId?: string; locked?: boolean
  }
  if (adminKey !== store.adminKey) return res.status(403).json({ error: 'Invalid admin key' })
  if (locked === undefined) return res.status(400).json({ error: 'locked required' })

  const applyLock = (id: string) => {
    const state = store.browserStates.get(id)
    if (state) { state.locked = locked; store.browserStates.set(id, state) }
    const sid = store.teamSockets.get(id)
    if (sid) io.to(sid).emit('admin:lock', { locked })
  }

  if (teamId) {
    applyLock(teamId)
  } else {
    store.lockedAll = locked
    for (const id of store.teams.keys()) applyLock(id)
  }
  io.emit('browser_states', store.getAllBrowserStates())
  return res.json({ ok: true })
})

// ── Socket.io bootstrap ───────────────────────────────────────────────────────

io.on('connection', socket => {
  socket.emit('firewall_mode', store.firewallMode)
  socket.emit('scores', store.getAllScores())
  socket.emit('traffic_history', store.getRecentTraffic(30))
  socket.emit('browser_states', store.getAllBrowserStates())
  broadcastActive()

  // ── Browser state tracking ───────────────────────────────────────────────
  socket.on('browser:register', ({ teamId }: { teamId: string }) => {
    // Evict old socket mapping for this team
    const oldSid = store.teamSockets.get(teamId)
    if (oldSid) store.socketTeams.delete(oldSid)
    store.teamSockets.set(teamId, socket.id)
    store.socketTeams.set(socket.id, teamId)

    const team = store.getTeam(teamId)
    if (team) {
      const existing = store.browserStates.get(teamId)
      store.browserStates.set(teamId, {
        teamId, teamName: team.name, teamColor: team.color,
        url: existing?.url ?? '', title: existing?.title ?? '',
        loading: false, lastUpdated: Date.now(),
        locked: existing?.locked ?? store.lockedAll, online: true,
      })
      io.emit('browser_states', store.getAllBrowserStates())
      const state = store.browserStates.get(teamId)
      if (state?.locked) socket.emit('admin:lock', { locked: true })
    }
  })

  socket.on('browser:state', (data: { teamId: string; url: string; title: string; loading: boolean }) => {
    const team = store.getTeam(data.teamId)
    if (!team) return
    const existing = store.browserStates.get(data.teamId)
    const updated: BrowserState = {
      teamId: data.teamId, teamName: team.name, teamColor: team.color,
      url: data.url, title: data.title, loading: data.loading,
      lastUpdated: Date.now(), locked: existing?.locked ?? false, online: true,
    }
    store.browserStates.set(data.teamId, updated)
    io.emit('browser_state_update', updated)
  })

  socket.on('disconnect', () => {
    const teamId = store.socketTeams.get(socket.id)
    if (teamId) {
      store.teamSockets.delete(teamId)
      store.socketTeams.delete(socket.id)
      const state = store.browserStates.get(teamId)
      if (state) {
        state.online = false
        state.loading = false
        store.browserStates.set(teamId, state)
        io.emit('browser_state_update', state)
      }
    }
  })
})

// ── Score ticker ──────────────────────────────────────────────────────────────

setInterval(() => {
  const updated = tickActiveRelayers()
  if (updated.length > 0) {
    broadcastScores()
    broadcastActive()
  }
}, 1000)

// ── Serve Expo web build (built by `npm run build`) ───────────────────────────

const publicDir = path.join(__dirname, '..', 'public')
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { index: 'index.html' }))

  // SPA fallback for admin dashboard at /admin/*
  const adminIndex = path.join(publicDir, 'admin', 'index.html')
  app.get(/^\/admin(\/.*)?$/, (_req, res) => {
    if (fs.existsSync(adminIndex)) res.sendFile(adminIndex)
    else res.status(404).send('Admin build not found.')
  })

  // SPA fallback for user app (Expo Router)
  app.get(/^(?!\/api\/).*$/, (_req, res) => {
    const index = path.join(publicDir, 'index.html')
    if (fs.existsSync(index)) res.sendFile(index)
    else res.status(404).send('Web build not found.')
  })
}

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT ?? 3001
const PROXY_PORT = parseInt(process.env.PROXY_PORT ?? '8080', 10)

httpServer.listen(PORT, () => {
  console.log(`\n🔒 Tera5G server  →  http://localhost:${PORT}`)
  console.log(`🔑 Admin key      →  ${store.adminKey}`)
  if (fs.existsSync(publicDir)) {
    console.log(`🌍 Web app        →  http://localhost:${PORT}/`)
  }
})

startProxyServer(PROXY_PORT, io)
