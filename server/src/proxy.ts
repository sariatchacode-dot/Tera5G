import http from 'http'
import https from 'https'
import net from 'net'
import { URL } from 'url'
import { Server as IOServer } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'
import { store } from './store'

const ALLOWED_DOMAINS = [
  'free.telecom5g.com',
  'cdn.tera5g.net',
  'updates.carrier.ng',
  'streaming.telecom5g.com',
]

function isDomainAllowed(hostname: string): boolean {
  if (store.firewallMode === 'vulnerable') return true
  return ALLOWED_DOMAINS.some(
    d => hostname === d || hostname.endsWith('.' + d)
  )
}

function emitProxyTraffic(
  io: IOServer,
  type: string,
  hostname: string,
  method: string,
  allowed: boolean
) {
  io.emit('proxy_traffic', {
    id: uuidv4(),
    timestamp: Date.now(),
    type,
    hostname,
    method,
    allowed,
    mode: store.firewallMode,
  })
}

function blockedPage(hostname: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Blocked – Tera5G</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#050b14;color:#c8d8f0;font-family:monospace;display:flex;
       align-items:center;justify-content:center;min-height:100vh;padding:24px}
  .card{border:1px solid #ff444440;background:#0d1526;border-radius:12px;
        padding:32px;max-width:480px;width:100%}
  h1{color:#ff4444;font-size:20px;margin-bottom:16px}
  .row{display:flex;justify-content:space-between;padding:8px 0;
       border-bottom:1px solid #1a2840;font-size:13px}
  .label{color:#4a5c7a} .val{color:#c8d8f0}
  .badge{background:#ff444420;color:#ff4444;border:1px solid #ff444440;
         border-radius:4px;padding:2px 8px;font-size:11px;letter-spacing:1px}
  .green{color:#00ff88} .blue{color:#00b4ff}
</style></head>
<body>
<div class="card">
  <h1>⛔ 403 Domain Blocked</h1>
  <div class="row"><span class="label">Hostname</span><span class="val">${hostname}</span></div>
  <div class="row"><span class="label">Firewall mode</span><span class="badge">PATCHED</span></div>
  <div class="row"><span class="label">JA3 check</span><span style="color:#ff4444">BLOCKED</span></div>
  <div class="row"><span class="label">SNI/Host</span><span style="color:#ff4444">MISMATCH DETECTED</span></div>
  <div class="row"><span class="label">Detection</span><span class="val">SNI ≠ HTTP Host header</span></div>
  <p style="margin-top:20px;font-size:12px;color:#4a5c7a">
    Tera5G Firewall — JA3 fingerprinting + SNI/Host correlation active
  </p>
</div>
</body></html>`
}

export function startProxyServer(port: number, io: IOServer): http.Server {
  const server = http.createServer((req, res) => {
    // HTTP proxy request — full URL in req.url
    let targetUrl: URL
    try {
      targetUrl = new URL(
        req.url!.startsWith('http') ? req.url! : `http://${req.headers.host}${req.url}`
      )
    } catch {
      res.writeHead(400)
      res.end('Bad Request')
      return
    }

    const { hostname } = targetUrl
    const allowed = isDomainAllowed(hostname)
    emitProxyTraffic(io, 'HTTP', hostname, req.method ?? 'GET', allowed)

    if (!allowed) {
      res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(blockedPage(hostname))
      return
    }

    const protocol = targetUrl.protocol === 'https:' ? https : http
    const proxyReq = protocol.request(
      {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: { ...req.headers, host: targetUrl.host },
      },
      proxyRes => {
        res.writeHead(proxyRes.statusCode!, proxyRes.headers as Record<string, string>)
        proxyRes.pipe(res, { end: true })
      }
    )

    proxyReq.on('error', () => {
      if (!res.headersSent) { res.writeHead(502); res.end('Bad Gateway') }
    })
    req.pipe(proxyReq, { end: true })
  })

  // HTTPS — CONNECT tunneling
  server.on('connect', (req, clientSocket, head) => {
    const parts = req.url!.split(':')
    const hostname = parts[0]
    const port = parseInt(parts[1] ?? '443', 10)
    const allowed = isDomainAllowed(hostname)

    emitProxyTraffic(io, 'HTTPS-CONNECT', hostname, 'CONNECT', allowed)

    if (!allowed) {
      clientSocket.write(
        'HTTP/1.1 403 Forbidden\r\nContent-Type: text/plain\r\n\r\nBlocked by Tera5G firewall\r\n'
      )
      clientSocket.destroy()
      return
    }

    const serverSocket = net.connect(port, hostname, () => {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      if (head?.length) serverSocket.write(head)
      serverSocket.pipe(clientSocket)
      clientSocket.pipe(serverSocket)
    })

    serverSocket.on('error', () => clientSocket.destroy())
    clientSocket.on('error', () => serverSocket.destroy())
  })

  server.listen(port, () => {
    console.log(`🌐 HTTP Proxy      →  port ${port}`)
    console.log(`   Set device proxy:  <server-ip>:${port}`)
  })

  return server
}
