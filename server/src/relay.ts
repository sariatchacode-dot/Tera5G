import http from 'http'
import https from 'https'
import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { URL } from 'url'
import { Server as IOServer } from 'socket.io'
import { store } from './store'

// Inject a <base> tag so relative URLs resolve correctly in the WebView
function injectBase(html: string, origin: string): string {
  const base = `<base href="${origin}/">`
  if (html.includes('<head>')) return html.replace('<head>', `<head>${base}`)
  if (html.includes('<HEAD>')) return html.replace('<HEAD>', `<HEAD>${base}`)
  return base + html
}

function blockedJson(hostname: string) {
  return {
    blocked: true,
    hostname,
    firewallMode: 'patched',
    reason: `Domain fronting detected: SNI ≠ HTTP Host (${hostname})`,
    detection: ['JA3 fingerprint match', 'SNI/Host correlation failure'],
  }
}

export function mountRelay(app: express.Application, io: IOServer) {
  /**
   * GET /api/relay?url=https://target.com&teamId=<uuid>
   *
   * In VULNERABLE mode  → fetches the real URL and streams it back.
   *   The device connects to this server (the "allowed" SNI endpoint) but
   *   gets content from an arbitrary blocked target — real domain fronting.
   *
   * In PATCHED mode → returns 403 with detection details.
   */
  app.get('/api/relay', (req, res) => {
    const { url, teamId } = req.query as { url?: string; teamId?: string }

    if (!url || !teamId) {
      return res.status(400).json({ error: 'url and teamId are required' })
    }

    const team = store.getTeam(teamId)
    if (!team) return res.status(403).json({ error: 'Invalid teamId' })

    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch {
      return res.status(400).json({ error: 'Invalid URL' })
    }

    const hostname = targetUrl.hostname
    const score = store.ensureScore(team)
    score.connectionsAttempted++

    // ── Patched mode ────────────────────────────────────────────────────────
    if (store.firewallMode === 'patched') {
      const entry = {
        id: uuidv4(),
        timestamp: Date.now(),
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        sni: 'tera5g-server',
        hostHeader: hostname,
        ja3Hash: 'relay-blocked',
        decision: {
          allowed: false,
          mode: 'patched' as const,
          reason: `Domain fronting relay blocked: SNI/Host mismatch for ${hostname}`,
          detectedSpoofing: true,
          sniMismatch: true,
        },
      }
      store.trafficLog.push(entry)
      if (store.trafficLog.length > 500) store.trafficLog.shift()
      io.emit('traffic', entry)
      io.emit('scores', store.getAllScores())

      res.status(403)
      res.setHeader('Content-Type', 'application/json')
      return res.json(blockedJson(hostname))
    }

    // ── Vulnerable mode — real proxy ─────────────────────────────────────────
    score.connectionsAllowed++

    const protocol = targetUrl.protocol === 'https:' ? https : http
    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port ? parseInt(targetUrl.port) : (targetUrl.protocol === 'https:' ? 443 : 80),
      path: targetUrl.pathname + targetUrl.search,
      method: 'GET',
      headers: {
        'Host': targetUrl.host,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Tera5G) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000,
    }

    const proxyReq = protocol.request(options, proxyRes => {
      // Follow 3xx redirects (one level)
      if (
        proxyRes.statusCode &&
        proxyRes.statusCode >= 300 &&
        proxyRes.statusCode < 400 &&
        proxyRes.headers.location
      ) {
        try {
          const redirectUrl = new URL(proxyRes.headers.location, url)
          res.redirect(
            `/api/relay?teamId=${teamId}&url=${encodeURIComponent(redirectUrl.href)}`
          )
        } catch {
          res.status(502).json({ error: 'Bad redirect' })
        }
        return
      }

      const contentType = proxyRes.headers['content-type'] ?? 'application/octet-stream'

      // For HTML, inject <base> so relative assets resolve
      if (contentType.includes('text/html')) {
        let body = ''
        proxyRes.setEncoding('utf8')
        proxyRes.on('data', chunk => { body += chunk })
        proxyRes.on('end', () => {
          const patched = injectBase(body, targetUrl.origin)
          res.status(proxyRes.statusCode ?? 200)
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('X-Tera5G-Tunnel', `vulnerable:${hostname}`)
          res.send(patched)

          // Log successful tunnel
          const entry = {
            id: uuidv4(),
            timestamp: Date.now(),
            teamId: team.id,
            teamName: team.name,
            teamColor: team.color,
            sni: 'tera5g-server',
            hostHeader: hostname,
            ja3Hash: 'relay-ok',
            decision: {
              allowed: true,
              mode: 'vulnerable' as const,
              reason: `Domain fronting relay: device→server→${hostname}`,
            },
          }
          store.trafficLog.push(entry)
          if (store.trafficLog.length > 500) store.trafficLog.shift()
          io.emit('traffic', entry)
          io.emit('scores', store.getAllScores())
        })
      } else {
        // Binary/JSON/CSS/JS — stream directly
        res.status(proxyRes.statusCode ?? 200)
        res.setHeader('Content-Type', contentType)
        res.setHeader('X-Tera5G-Tunnel', `vulnerable:${hostname}`)
        proxyRes.pipe(res, { end: true })
      }
    })

    proxyReq.on('error', err => {
      if (!res.headersSent) {
        res.status(502).json({ error: `Upstream error: ${err.message}` })
      }
    })

    proxyReq.on('timeout', () => {
      proxyReq.destroy()
      if (!res.headersSent) res.status(504).json({ error: 'Gateway timeout' })
    })

    proxyReq.end()
  })
}
