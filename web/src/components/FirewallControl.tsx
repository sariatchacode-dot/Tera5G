import { useState } from 'react'
import { ShieldAlert, ShieldCheck, KeyRound, Loader2 } from 'lucide-react'
import { FirewallMode } from '../types'

interface Props {
  mode: FirewallMode
}

export function FirewallControl({ mode }: Props) {
  const [adminKey, setAdminKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function setMode(newMode: FirewallMode) {
    if (!adminKey.trim()) {
      setError('Admin key required')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/firewall/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode, adminKey }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Request failed')
      } else {
        setSuccess(`Firewall set to ${newMode === 'patched' ? 'Patched' : 'Vulnerable'}`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch {
      setError('Cannot reach server')
    } finally {
      setLoading(false)
    }
  }

  const isVulnerable = mode === 'vulnerable'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-tera-text">Firewall Control</h2>
        <p className="text-xs text-tera-muted mt-0.5">Toggle assessment mode</p>
      </div>

      {/* Current mode card */}
      <div
        className="flex items-center gap-3 rounded-ios-xl p-3"
        style={{
          backgroundColor: isVulnerable ? 'rgba(255,69,58,0.10)' : 'rgba(29,184,20,0.10)',
          border: `0.5px solid ${isVulnerable ? 'rgba(255,69,58,0.35)' : 'rgba(29,184,20,0.35)'}`,
        }}
      >
        <div
          className="w-9 h-9 rounded-ios flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: isVulnerable ? 'rgba(255,69,58,0.18)' : 'rgba(29,184,20,0.18)' }}
        >
          {isVulnerable
            ? <ShieldAlert size={17} className="text-tera-red" />
            : <ShieldCheck size={17} className="text-tera-green" />
          }
        </div>
        <div className="min-w-0">
          <div className={`text-sm font-semibold ${isVulnerable ? 'text-tera-red' : 'text-tera-green'}`}>
            {isVulnerable ? 'Bypass Active' : 'Patched'}
          </div>
          <div className="text-xs text-tera-muted truncate">
            {isVulnerable ? 'SNI-only · Host header ignored' : 'JA3 + SNI/Host correlation on'}
          </div>
        </div>
      </div>

      {/* Admin key input */}
      <div>
        <label
          className="block text-xs font-semibold text-tera-muted uppercase tracking-wider mb-1.5"
        >
          Admin Key
        </label>
        <div
          className="flex items-center gap-2.5 rounded-ios"
          style={{
            backgroundColor: '#2C2C2E',
            border: '0.5px solid rgba(84,84,88,0.65)',
            paddingInline: 14,
            paddingBlock: 11,
          }}
        >
          <KeyRound size={14} className="text-tera-muted flex-shrink-0" />
          <input
            type="password"
            placeholder="Enter admin key"
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            className="flex-1 bg-transparent text-sm text-tera-text placeholder:text-tera-muted outline-none"
            style={{ fontSize: 14 }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMode('vulnerable')}
          disabled={loading || mode === 'vulnerable'}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-ios text-xs font-semibold transition-all disabled:cursor-not-allowed"
          style={{
            color: mode === 'vulnerable' ? 'rgba(255,69,58,0.40)' : '#FF453A',
            backgroundColor: mode === 'vulnerable' ? 'rgba(255,69,58,0.04)' : 'rgba(255,69,58,0.10)',
            border: `0.5px solid ${mode === 'vulnerable' ? 'rgba(255,69,58,0.20)' : 'rgba(255,69,58,0.40)'}`,
          }}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <ShieldAlert size={12} />}
          {mode === 'vulnerable' ? 'Active' : 'Set Vulnerable'}
        </button>
        <button
          onClick={() => setMode('patched')}
          disabled={loading || mode === 'patched'}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-ios text-xs font-semibold transition-all disabled:cursor-not-allowed"
          style={{
            color: mode === 'patched' ? 'rgba(29,184,20,0.40)' : '#1DB814',
            backgroundColor: mode === 'patched' ? 'rgba(29,184,20,0.04)' : 'rgba(29,184,20,0.10)',
            border: `0.5px solid ${mode === 'patched' ? 'rgba(29,184,20,0.20)' : 'rgba(29,184,20,0.40)'}`,
          }}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
          {mode === 'patched' ? 'Active' : 'Apply Patch'}
        </button>
      </div>

      {error && (
        <div
          className="rounded-ios px-3 py-2.5 text-xs"
          style={{ backgroundColor: 'rgba(255,69,58,0.10)', border: '0.5px solid rgba(255,69,58,0.35)', color: '#FF453A' }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="rounded-ios px-3 py-2.5 text-xs"
          style={{ backgroundColor: 'rgba(29,184,20,0.10)', border: '0.5px solid rgba(29,184,20,0.35)', color: '#1DB814' }}
        >
          {success}
        </div>
      )}

      {/* Legend */}
      <div
        className="rounded-ios-xl p-3 space-y-1.5"
        style={{ backgroundColor: '#1C1C1E', border: '0.5px solid rgba(84,84,88,0.65)' }}
      >
        <p className="text-xs font-semibold text-tera-text mb-2">Patch technique</p>
        <p className="text-xs text-tera-muted">• JA3 fingerprinting — hash TLS ClientHello</p>
        <p className="text-xs text-tera-muted">• Block hashes of known domain-fronting clients</p>
        <p className="text-xs text-tera-muted">• Drop connections where TLS SNI ≠ HTTP Host</p>
      </div>
    </div>
  )
}
