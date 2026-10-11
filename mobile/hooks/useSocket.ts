import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { SERVER_URL } from '../constants/config'

export type FirewallMode = 'vulnerable' | 'patched'

export interface ScoreEntry {
  teamId: string
  teamName: string
  color: string
  totalPoints: number
  activeSeconds: number
  connectionsAttempted: number
  connectionsAllowed: number
  longestSession: number
  firstConnectBonus: boolean
}

interface SocketState {
  firewallMode: FirewallMode
  scores: ScoreEntry[]
  connected: boolean
  alert: string | null
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [state, setState] = useState<SocketState>({
    firewallMode: 'vulnerable',
    scores: [],
    connected: false,
    alert: null,
  })

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => setState(s => ({ ...s, connected: true })))
    socket.on('disconnect', () => setState(s => ({ ...s, connected: false })))
    socket.on('firewall_mode', (mode: FirewallMode) =>
      setState(s => ({ ...s, firewallMode: mode }))
    )
    socket.on('scores', (scores: ScoreEntry[]) =>
      setState(s => ({ ...s, scores }))
    )
    socket.on('firewall_patched', ({ message }: { message: string }) =>
      setState(s => ({ ...s, alert: message }))
    )
    socket.on('firewall_vulnerable', ({ message }: { message: string }) =>
      setState(s => ({ ...s, alert: message }))
    )

    return () => { socket.disconnect() }
  }, [])

  function clearAlert() {
    setState(s => ({ ...s, alert: null }))
  }

  return { ...state, clearAlert }
}
