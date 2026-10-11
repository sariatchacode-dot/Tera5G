import { store } from './store'

const POINTS_PER_REQUEST = 3
const POINTS_PER_ACTIVE_SECOND = 1
const FIRST_RELAY_BONUS = 15

export function awardFirstRelay(teamId: string): boolean {
  if (store.firstRelayTeamId === null) {
    store.firstRelayTeamId = teamId
    const score = store.scores.get(teamId)
    if (score) {
      score.firstConnectBonus = true
      score.totalPoints += FIRST_RELAY_BONUS
    }
    return true
  }
  return false
}

export function awardRelayRequest(teamId: string): void {
  const score = store.scores.get(teamId)
  if (!score) return
  score.totalPoints += POINTS_PER_REQUEST
  score.connectionsAllowed++
  // Track session duration (time since first relay)
  const firstActive = store.teamActivity.get(teamId)
  if (firstActive) {
    const duration = Math.floor((Date.now() - firstActive) / 1000)
    if (duration > score.longestSession) score.longestSession = duration
  }
}

// Called every second — award 1pt to every team that's been active in the last 60s
export function tickActiveRelayers(): string[] {
  const activeIds = store.getActiveTeamIds()
  for (const teamId of activeIds) {
    const score = store.scores.get(teamId)
    if (score) {
      score.totalPoints += POINTS_PER_ACTIVE_SECOND
      score.activeSeconds += 1
    }
  }
  return activeIds
}
