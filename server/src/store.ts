import { Team, TrafficEntry, ScoreEntry, FirewallMode, BrowserState } from './types'

class Store {
  teams: Map<string, Team> = new Map()
  trafficLog: TrafficEntry[] = []
  scores: Map<string, ScoreEntry> = new Map()
  teamActivity: Map<string, number> = new Map() // teamId → last relay timestamp
  firewallMode: FirewallMode = 'vulnerable'
  readonly adminKey = process.env.ADMIN_KEY ?? 'tera5g-admin-2024'
  firstRelayTeamId: string | null = null

  // Browser management
  browserStates: Map<string, BrowserState> = new Map()
  teamSockets: Map<string, string> = new Map()   // teamId → socketId
  socketTeams: Map<string, string> = new Map()   // socketId → teamId
  lockedAll: boolean = false

  getTeam(id: string): Team | undefined {
    return this.teams.get(id)
  }

  getAllScores(): ScoreEntry[] {
    return Array.from(this.scores.values()).sort(
      (a, b) => b.totalPoints - a.totalPoints
    )
  }

  ensureScore(team: Team): ScoreEntry {
    if (!this.scores.has(team.id)) {
      this.scores.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        color: team.color,
        totalPoints: 0,
        activeSeconds: 0,
        connectionsAttempted: 0,
        connectionsAllowed: 0,
        longestSession: 0,
        firstConnectBonus: false,
      })
    }
    return this.scores.get(team.id)!
  }

  getRecentTraffic(limit = 50): TrafficEntry[] {
    return this.trafficLog.slice(-limit).reverse()
  }

  // Returns teams that have relayed in the last 60 seconds
  getActiveTeamIds(): string[] {
    const cutoff = Date.now() - 60_000
    return Array.from(this.teamActivity.entries())
      .filter(([, ts]) => ts > cutoff)
      .map(([id]) => id)
  }

  getAllBrowserStates(): BrowserState[] {
    return Array.from(this.browserStates.values())
  }
}

export const store = new Store()
