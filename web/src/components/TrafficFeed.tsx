import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { TrafficEntry } from '../types'

interface Props {
  entries: TrafficEntry[]
}

function ts(ms: number) {
  return new Date(ms).toLocaleTimeString('en-GB', { hour12: false })
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

export function TrafficFeed({ entries }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-tera-text">Live Traffic</h2>
          <p className="text-xs text-tera-muted mt-0.5">Real-time relay requests</p>
        </div>
        <span
          className="text-xs font-medium text-tera-muted px-2.5 py-1 rounded-ios"
          style={{ backgroundColor: 'rgba(84,84,88,0.12)', border: '0.5px solid rgba(84,84,88,0.36)' }}
        >
          {entries.length}
        </span>
      </div>

      {/* Column headers */}
      <div
        className="grid gap-2 px-3 py-2 mb-1 rounded-ios flex-shrink-0"
        style={{
          gridTemplateColumns: '28px 68px 120px 130px 110px 1fr',
          backgroundColor: 'rgba(84,84,88,0.08)',
        }}
      >
        {['', 'Time', 'Team', 'SNI', 'Host', 'Reason'].map(h => (
          <span key={h} className="text-xs font-semibold text-tera-muted uppercase tracking-wider">{h}</span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <div
              className="w-10 h-10 rounded-ios-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(84,84,88,0.10)', border: '0.5px solid rgba(84,84,88,0.36)' }}
            >
              <AlertTriangle size={18} className="text-tera-muted" />
            </div>
            <span className="text-sm text-tera-muted">Waiting for connection attempts…</span>
          </div>
        )}

        {entries.map(e => {
          const allowed = e.decision.allowed
          const spoofed = e.decision.detectedSpoofing

          const accent = allowed
            ? { border: 'rgba(29,184,20,0.50)', bg: 'rgba(29,184,20,0.05)' }
            : spoofed
              ? { border: 'rgba(255,159,10,0.50)', bg: 'rgba(255,159,10,0.05)' }
              : { border: 'rgba(255,69,58,0.50)', bg: 'rgba(255,69,58,0.05)' }

          return (
            <div
              key={e.id}
              className="grid gap-2 px-3 py-2.5 rounded-ios text-xs transition-colors hover:opacity-90"
              style={{
                gridTemplateColumns: '28px 68px 120px 130px 110px 1fr',
                borderLeft: `2px solid ${accent.border}`,
                backgroundColor: accent.bg,
              }}
            >
              <div className="flex items-center">
                {allowed
                  ? <CheckCircle size={13} className="text-tera-green" />
                  : spoofed
                    ? <AlertTriangle size={13} className="text-tera-yellow" />
                    : <XCircle size={13} className="text-tera-red" />
                }
              </div>
              <span className="text-tera-muted font-mono text-xs">{ts(e.timestamp)}</span>
              <span className="font-medium truncate text-xs" style={{ color: e.teamColor }}>
                {e.teamName}
              </span>
              <span className="text-tera-blue truncate text-xs" title={e.sni}>
                {truncate(e.sni, 22)}
              </span>
              <span
                className="truncate text-xs"
                style={{ color: allowed ? '#1DB814' : '#FF453A' }}
                title={e.hostHeader}
              >
                {truncate(e.hostHeader, 18)}
              </span>
              <span className="text-tera-muted truncate text-xs" title={e.decision.reason}>
                {truncate(e.decision.reason, 60)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
