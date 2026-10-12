import { Fingerprint, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { TrafficEntry } from '../types'

interface Props {
  entries: TrafficEntry[]
}

export function JA3Inspector({ entries }: Props) {
  const [selected, setSelected] = useState<TrafficEntry | null>(null)

  const withDetails = entries.filter(e => e.ja3Hash && e.ja3Hash !== 'n/a')

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 mb-3">
        <h2 className="text-sm font-semibold text-tera-text">JA3 Inspector</h2>
        <p className="text-xs text-tera-muted mt-0.5">TLS fingerprint analysis</p>
      </div>

      <div className="space-y-1.5 overflow-y-auto flex-1">
        {withDetails.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-1.5">
            <Fingerprint size={18} className="text-tera-muted" />
            <span className="text-sm text-tera-muted">No fingerprint data yet</span>
          </div>
        )}

        {withDetails.slice(0, 20).map(e => {
          const isOpen = selected?.id === e.id
          const blocked = !e.decision.allowed

          return (
            <div
              key={e.id}
              className="rounded-ios-xl overflow-hidden"
              style={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(84,84,88,0.65)' }}
            >
              <button
                onClick={() => setSelected(isOpen ? null : e)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs transition-opacity hover:opacity-80"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-ios flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: blocked ? 'rgba(255,69,58,0.18)' : 'rgba(10,132,255,0.18)' }}
                  >
                    <Fingerprint
                      size={13}
                      style={{ color: blocked ? '#FF453A' : '#0A84FF' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <span
                      className="block font-mono text-xs truncate"
                      style={{ color: '#8E8E93' }}
                    >
                      {e.decision.ja3Hash?.slice(0, 16)}…
                    </span>
                    <span className="text-xs truncate" style={{ color: e.teamColor }}>
                      {e.teamName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {blocked && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-ios"
                      style={{
                        color: '#FF453A',
                        backgroundColor: 'rgba(255,69,58,0.12)',
                        border: '0.5px solid rgba(255,69,58,0.35)',
                      }}
                    >
                      Blocked
                    </span>
                  )}
                  {isOpen
                    ? <ChevronUp size={12} className="text-tera-muted" />
                    : <ChevronDown size={12} className="text-tera-muted" />
                  }
                </div>
              </button>

              {isOpen && (
                <div
                  className="px-3 py-3 space-y-3 text-xs"
                  style={{ borderTop: '0.5px solid rgba(84,84,88,0.36)', backgroundColor: '#000000' }}
                >
                  <div>
                    <span className="text-tera-muted block mb-1 font-semibold uppercase tracking-wider text-xs">Full Hash</span>
                    <span className="font-mono break-all" style={{ color: '#0A84FF' }}>{e.decision.ja3Hash}</span>
                  </div>

                  {e.decision.ja3String && (
                    <div>
                      <span className="text-tera-muted block mb-1.5 font-semibold uppercase tracking-wider text-xs">
                        JA3 Fields
                      </span>
                      <div
                        className="rounded-ios p-2.5 space-y-1.5"
                        style={{ backgroundColor: '#1C1C1E' }}
                      >
                        {['TLS Version', 'Cipher Suites', 'Extensions', 'Elliptic Curves', 'EC Point Formats']
                          .map((label, idx) => {
                            const parts = e.decision.ja3String!.split(',')
                            return (
                              <div key={label} className="flex items-start justify-between gap-2">
                                <span className="text-tera-muted text-xs">{label}</span>
                                <span className="text-tera-text text-xs font-mono text-right break-all">
                                  {parts[idx] ?? '—'}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-tera-muted block mb-1 font-semibold uppercase tracking-wider text-xs">
                      SNI / Host
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs" style={{ color: '#0A84FF' }}>{e.sni}</span>
                      <span className="text-tera-muted">→</span>
                      <span
                        className="font-mono text-xs"
                        style={{ color: e.decision.sniMismatch ? '#FF453A' : '#1DB814' }}
                      >
                        {e.hostHeader}
                      </span>
                      {e.decision.sniMismatch && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-ios"
                          style={{
                            color: '#FF453A',
                            backgroundColor: 'rgba(255,69,58,0.12)',
                            border: '0.5px solid rgba(255,69,58,0.35)',
                          }}
                        >
                          Mismatch
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
