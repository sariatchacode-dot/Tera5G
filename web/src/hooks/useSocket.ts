import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { FirewallMode, TrafficEntry, ScoreEntry, ActiveTeamInfo } from '../types'

const SERVER = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001'

interface SocketState {
  firewallMode: FirewallMode
  scores: ScoreEntry[]
  traffic: TrafficEntry[]
  activeSessions: ActiveTeamInfo[]
  alert: { type: 'patched' | 'vulnerable'; message: string } | null
  connected: boolean
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [state, setState] = useState<SocketState>({
    firewallMode: 'vulnerable',
    scores: [],
    traffic: [],
    activeSessions: [],
    alert: null,
    connected: false,
  })

  useEffect(() => {
    const socket = io(SERVER, { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => setState(s => ({ ...s, connected: true })))
    socket.on('disconnect', () => setState(s => ({ ...s, connected: false })))
    socket.on('firewall_mode', (mode: FirewallMode) =>
      setState(s => ({ ...s, firewallMode: mode }))
    )
    socket.on('scores', (scores: ScoreEntry[]) =>
      setState(s => ({ ...s, scores }))
    )
    socket.on('traffic', (entry: TrafficEntry) =>
      setState(s => ({ ...s, traffic: [entry, ...s.traffic].slice(0, 100) }))
    )
    socket.on('traffic_history', (entries: TrafficEntry[]) =>
      setState(s => ({ ...s, traffic: entries }))
    )
    socket.on('active_sessions', (sessions: ActiveTeamInfo[]) =>
      setState(s => ({ ...s, activeSessions: sessions }))
    )
    socket.on('firewall_patched', ({ message }: { message: string }) =>
      setState(s => ({ ...s, alert: { type: 'patched', message } }))
    )
    socket.on('firewall_vulnerable', ({ message }: { message: string }) =>
      setState(s => ({ ...s, alert: { type: 'vulnerable', message } }))
    )

    return () => { socket.disconnect() }
  }, [])

  function clearAlert() {
    setState(s => ({ ...s, alert: null }))
  }

  return { ...state, clearAlert }
}
