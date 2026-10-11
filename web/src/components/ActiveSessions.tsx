import { Activity, Globe } from 'lucide-react'

interface ActiveTeamInfo {
  teamId: string
  teamName: string
  teamColor: string
  lastSeen: number
  activeSeconds: number
  requestCount: number
}

interface Props {
  sessions: ActiveTeamInfo[]
}

function fmtDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`
}

export function ActiveSessions({ sessions }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-tera-text">Active Tunnels</h2>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${sessions.length > 0 ? 'bg-tera-green animate-pulse' : 'bg-tera-muted'}`}
            />
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-ios"
              style={{ backgroundColor: 'rgba(84,84,88,0.12)', border: '0.5px solid rgba(84,84,88,0.36)', color: '#8E8E93' }}
            >
              {sessions.length}
            </span>
          </div>
        </div>
        <p className="text-xs text-tera-muted mt-0.5">Teams bypassing now</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-1.5">
            <Globe size={18} className="text-tera-muted" />
            <span className="text-sm text-tera-muted">No active tunnels</span>
          </div>
        )}

        {sessions.map(s => (
          <div
            key={s.teamId}
            className="rounded-ios-xl p-3 animate-fade-in"
            style={{
              backgroundColor: '#1C1C1E',
              border: '0.5px solid rgba(29,184,20,0.30)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold truncate" style={{ color: s.teamColor }}>
                {s.teamName}
              </span>
              <div className="flex items-center gap-1 text-xs ml-2 flex-shrink-0" style={{ color: '#1DB814' }}>
                <Activity size={11} className="animate-pulse" />
                <span className="font-semibold">{fmtDuration(s.activeSeconds)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-tera-muted mb-1">
              <Globe size={10} className="text-tera-blue flex-shrink-0" />
              <span className="text-tera-blue font-medium">relay server</span>
              <span>→ real internet</span>
            </div>

            <div className="text-xs text-tera-muted">
              {s.requestCount} request{s.requestCount !== 1 ? 's' : ''} ·{' '}
              {Math.round((Date.now() - s.lastSeen) / 1000)}s ago
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
