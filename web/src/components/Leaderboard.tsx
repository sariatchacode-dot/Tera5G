import { Zap, Clock, Target, Trophy } from 'lucide-react'
import { ScoreEntry } from '../types'

interface Props {
  scores: ScoreEntry[]
}

function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

const MEDALS = ['🥇', '🥈', '🥉']

export function Leaderboard({ scores }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 mb-3">
        <h2 className="text-sm font-semibold text-tera-text">Leaderboard</h2>
        <p className="text-xs text-tera-muted mt-0.5">{scores.length} team{scores.length !== 1 ? 's' : ''}</p>
      </div>

      {scores.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-tera-muted">No teams yet</span>
        </div>
      )}

      <div className="space-y-2 overflow-y-auto flex-1">
        {scores.map((entry, i) => (
          <div
            key={entry.teamId}
            className="rounded-ios-xl p-3 animate-fade-in"
            style={{
              backgroundColor: '#1C1C1E',
              border: '0.5px solid rgba(84,84,88,0.65)',
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base flex-shrink-0">{MEDALS[i] ?? `#${i + 1}`}</span>
                <div className="min-w-0">
                  <span className="font-semibold text-sm block truncate" style={{ color: entry.color }}>
                    {entry.teamName}
                  </span>
                  {entry.firstConnectBonus && (
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: '#FF9F0A',
                        backgroundColor: 'rgba(255,159,10,0.12)',
                        border: '0.5px solid rgba(255,159,10,0.30)',
                        borderRadius: 20,
                        padding: '1px 6px',
                        display: 'inline-block',
                        marginTop: 2,
                      }}
                    >
                      +15 first
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-baseline gap-1 flex-shrink-0 ml-2">
                <Zap size={12} className="text-tera-green mb-px" />
                <span className="text-lg font-bold text-tera-text leading-none" style={{ letterSpacing: -0.5 }}>
                  {entry.totalPoints}
                </span>
                <span className="text-xs text-tera-muted">pts</span>
              </div>
            </div>

            {/* Progress */}
            <div
              className="h-0.5 rounded-full overflow-hidden mb-2"
              style={{ backgroundColor: 'rgba(84,84,88,0.36)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (entry.totalPoints / Math.max(1, scores[0]?.totalPoints ?? 1)) * 100)}%`,
                  backgroundColor: entry.color,
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-1 text-xs text-tera-muted">
              <div className="flex items-center gap-1">
                <Clock size={9} className="text-tera-blue flex-shrink-0" />
                <span className="truncate">{fmtTime(entry.activeSeconds)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target size={9} className="flex-shrink-0" style={{ color: '#BF5AF2' }} />
                <span className="truncate">{entry.connectionsAllowed}/{entry.connectionsAttempted}</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy size={9} className="text-tera-yellow flex-shrink-0" />
                <span className="truncate">{fmtTime(entry.longestSession)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
