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
  ja3Hash?: string
  ja3String?: string
  ja3Blocked?: boolean
}

export interface TrafficEntry {
  id: string
  timestamp: number
  teamId: string
  teamName: string
  teamColor: string
  sni: string
  hostHeader: string
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
