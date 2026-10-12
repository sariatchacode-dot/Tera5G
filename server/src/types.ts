export type FirewallMode = 'vulnerable' | 'patched'

export interface Team {
  id: string
  name: string
  color: string
  createdAt: number
}

export interface FirewallDecision {
  allowed: boolean
  reason: string
  mode: FirewallMode
  detectedSpoofing?: boolean
  sniMismatch?: boolean
}

export interface TrafficEntry {
  id: string
  timestamp: number
  teamId: string
  teamName: string
  teamColor: string
  sni: string       // The "allowed" domain the device connects to (the server's identity)
  hostHeader: string // The actual target hostname inside the tunnel
  ja3Hash: string
  decision: FirewallDecision
  bytes?: number
}

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

export interface ActiveTeamInfo {
  teamId: string
  teamName: string
  teamColor: string
  lastSeen: number
  activeSeconds: number
  requestCount: number
}

export interface BrowserState {
  teamId: string
  teamName: string
  teamColor: string
  url: string
  title: string
  loading: boolean
  lastUpdated: number
  locked: boolean
  online: boolean
}
