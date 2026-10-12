import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { FirewallMode, TrafficEntry, ScoreEntry, ActiveTeamInfo, BrowserState } from '../types'

const SERVER = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '')

interface SocketState {
  firewallMode: FirewallMode
  scores: ScoreEntry[]
  traffic: TrafficEntry[]
  activeSessions: ActiveTeamInfo[]
  browserStates: BrowserState[]
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
    browserStates: [],
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
    // Browser management events
    socket.on('browser_states', (states: BrowserState[]) =>
      setState(s => ({ ...s, browserStates: states }))
    )
    socket.on('browser_state_update', (updated: BrowserState) =>
      setState(s => {
        const exists = s.browserStates.some(b => b.teamId === updated.teamId)
        return {
          ...s,
          browserStates: exists
            ? s.browserStates.map(b => b.teamId === updated.teamId ? updated : b)
            : [...s.browserStates, updated],
        }
      })
    )
    socket.on('team_kicked', ({ teamId }: { teamId: string }) =>
      setState(s => ({
        ...s,
        browserStates: s.browserStates.filter(b => b.teamId !== teamId),
      }))
    )

    return () => { socket.disconnect() }
  }, [])

  function clearAlert() {
    setState(s => ({ ...s, alert: null }))
  }

  return { ...state, clearAlert }
}
