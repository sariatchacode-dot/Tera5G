import { useState, useEffect, CSSProperties } from 'react'
import {
  Globe, Lock, Unlock, X, Send, KeyRound, Monitor,
  Loader2, Megaphone, ArrowUpRight, CheckCircle,
  RefreshCw, AlertTriangle, WifiOff, Wifi,
} from 'lucide-react'
import { BrowserState, ScoreEntry } from '../types'

const SERVER = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '')

interface Props {
  browserStates: BrowserState[]
  scores: ScoreEntry[]
}

interface ActionModal {
  teamId: string | null
  teamName: string
  value: string
}

function formatDuration(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

function displayUrl(url: string): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    const path = u.pathname === '/' ? '' : u.pathname
    const display = u.hostname + path
    return display.length > 42 ? display.slice(0, 42) + '…' : display
  } catch {
    return url.length > 42 ? url.slice(0, 42) + '…' : url
  }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Chip({ value, label, color = '#636366' }: { value: number; label: string; color?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(84,84,88,0.12)',
      border: '0.5px solid rgba(84,84,88,0.36)',
      borderRadius: 8, padding: '4px 10px',
    }}>
      <span style={{ color, fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{value}</span>
      <span style={{ color: '#636366', fontSize: 11 }}>{label}</span>
    </div>
  )
}

function CmdBtn({
  icon, label, color = '#636366', disabled = false, loading = false, onClick,
}: {
  icon: React.ReactNode; label: string; color?: string; disabled?: boolean; loading?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        backgroundColor: disabled ? 'rgba(84,84,88,0.06)' : `${color}18`,
        border: `0.5px solid ${disabled ? 'rgba(84,84,88,0.2)' : color + '50'}`,
        borderRadius: 8, padding: '7px 12px',
        color: disabled ? '#4a4a4a' : color,
        fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
      {label}
    </button>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        backgroundColor: '#1C1C1E',
        border: '0.5px solid rgba(84,84,88,0.65)',
        borderRadius: 16, padding: 24, width: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ color: '#FFF', fontSize: 15, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#636366' }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  backgroundColor: '#000', border: '0.5px solid rgba(84,84,88,0.65)',
  borderRadius: 8, padding: '10px 14px',
  color: '#FFF', fontSize: 13, outline: 'none',
}

function ModalPrimary({ color, onClick, loading, children }: {
  color: string; onClick: () => void; loading: boolean; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        flex: 1, backgroundColor: `${color}22`,
        border: `0.5px solid ${color}60`, borderRadius: 8,
        padding: '10px', color, fontWeight: 600, fontSize: 13,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      {loading && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
      {children}
    </button>
  )
}

function ModalCancel({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, backgroundColor: 'rgba(84,84,88,0.15)',
        border: '0.5px solid rgba(84,84,88,0.36)', borderRadius: 8,
        padding: '10px', color: '#8E8E93', fontSize: 13, cursor: 'pointer',
      }}
    >
      Cancel
    </button>
  )
}

// ── Browser card ─────────────────────────────────────────────────────────────

interface CardProps {
  score: ScoreEntry
  browser: BrowserState | null
  onPushUrl: () => void
  onAnnounce: () => void
  onLock: () => void
  onKick: () => void
  onResetScore: () => void
  actionPending: boolean
}

function BrowserCard({ score, browser, onPushUrl, onAnnounce, onLock, onKick, onResetScore, actionPending }: CardProps) {
  const online = browser?.online ?? false
  const locked = browser?.locked ?? false
  const url = browser?.url ?? ''
  const loading = browser?.loading ?? false

  return (
    <div style={{
      backgroundColor: '#111113',
      border: `0.5px solid ${online ? 'rgba(84,84,88,0.4)' : 'rgba(84,84,88,0.2)'}`,
      borderRadius: 14, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      opacity: online ? 1 : 0.65,
      transition: 'opacity 0.2s',
    }}>
      {/* Color accent bar */}
      <div style={{ height: 3, backgroundColor: score.color, flexShrink: 0 }} />

      {/* Header: team name + status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '11px 14px 8px', flexShrink: 0,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: 4, flexShrink: 0,
          backgroundColor: online ? '#1DB814' : '#3A3A3C',
          boxShadow: online ? '0 0 6px #1DB81480' : 'none',
        }} />
        <span style={{ color: '#FFF', fontSize: 14, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {score.teamName}
        </span>
        {locked && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            backgroundColor: 'rgba(255,159,10,0.15)',
            border: '0.5px solid rgba(255,159,10,0.4)',
            borderRadius: 6, padding: '2px 7px',
          }}>
            <Lock size={10} color="#FF9F0A" />
            <span style={{ color: '#FF9F0A', fontSize: 10, fontWeight: 600 }}>LOCKED</span>
          </div>
        )}
        {!online && (
          <span style={{ color: '#3A3A3C', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}>OFFLINE</span>
        )}
        {online && !locked && (
          <span style={{
            color: '#1DB814', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
          }}>LIVE</span>
        )}
      </div>

      {/* Browser address bar */}
      <div style={{ padding: '0 14px 10px', flexShrink: 0 }}>
        <div style={{
          backgroundColor: '#000', borderRadius: 8,
          border: '0.5px solid rgba(84,84,88,0.4)',
          padding: '6px 10px',
          display: 'flex', alignItems: 'center', gap: 6,
          minHeight: 30,
        }}>
          {loading
            ? <Loader2 size={10} color="#636366" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            : <Globe size={10} color={online && url ? '#636366' : '#3A3A3C'} style={{ flexShrink: 0 }} />
          }
          <span style={{
            fontSize: 11, fontFamily: 'monospace',
            color: url ? '#8E8E93' : '#3A3A3C',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {url ? displayUrl(url) : 'no active page'}
          </span>
        </div>
      </div>

      {/* Score stats */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center',
        padding: '0 14px 10px', flexShrink: 0,
      }}>
        <span style={{ color: score.color, fontSize: 12, fontWeight: 700 }}>
          {score.totalPoints} pts
        </span>
        <span style={{ color: '#3A3A3C', fontSize: 12 }}>·</span>
        <span style={{ color: '#636366', fontSize: 11 }}>
          {score.connectionsAllowed} req
        </span>
        <span style={{ color: '#3A3A3C', fontSize: 12 }}>·</span>
        <span style={{ color: '#636366', fontSize: 11 }}>
          {formatDuration(score.activeSeconds)}
        </span>
      </div>

      {/* Action row */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap',
        padding: '8px 10px',
        borderTop: '0.5px solid rgba(84,84,88,0.2)',
        backgroundColor: '#0A0A0C',
        marginTop: 'auto',
      }}>
        <CardActionBtn icon={<ArrowUpRight size={11} />} label="Push URL" color="#0A84FF" onClick={onPushUrl} disabled={actionPending} />
        <CardActionBtn icon={<Megaphone size={11} />} label="Announce" color="#FF9F0A" onClick={onAnnounce} disabled={actionPending} />
        <CardActionBtn icon={locked ? <Unlock size={11} /> : <Lock size={11} />} label={locked ? 'Unlock' : 'Lock'} color={locked ? '#1DB814' : '#FF9F0A'} onClick={onLock} disabled={actionPending} />
        <CardActionBtn icon={<RefreshCw size={11} />} label="Reset" color="#636366" onClick={onResetScore} disabled={actionPending} />
        <CardActionBtn icon={<X size={11} />} label="Kick" color="#FF453A" onClick={onKick} disabled={actionPending} />
      </div>
    </div>
  )
}

function CardActionBtn({ icon, label, color, onClick, disabled }: {
  icon: React.ReactNode; label: string; color: string; onClick: () => void; disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        backgroundColor: `${color}12`,
        border: `0.5px solid ${color}40`,
        borderRadius: 6, padding: '4px 8px',
        color, fontSize: 11, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.1s',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 12, color: '#3A3A3C',
    }}>
      <Monitor size={40} color="#2C2C2E" />
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#636366', fontSize: 15, fontWeight: 600 }}>No browsers connected</div>
        <div style={{ color: '#3A3A3C', fontSize: 13, marginTop: 4 }}>
          Waiting for mobile clients to join the assessment…
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function BrowserGrid({ browserStates, scores }: Props) {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('tera5g-admin-key') ?? '')
  const [keyVerified, setKeyVerified] = useState(false)
  const [broadcastUrl, setBroadcastUrl] = useState('')
  const [announceMsg, setAnnounceMsg] = useState('')
  const [pushModal, setPushModal] = useState<ActionModal | null>(null)
  const [announceModal, setAnnounceModal] = useState<ActionModal | null>(null)
  const [confirmKick, setConfirmKick] = useState<{ teamId: string; teamName: string } | null>(null)
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem('tera5g-admin-key', adminKey)
  }, [adminKey])

  function showToast(message: string, ok = true) {
    setToast({ message, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function adminPost(path: string, body: Record<string, unknown>, actionId: string) {
    setPendingAction(actionId)
    try {
      const res = await fetch(`${SERVER}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, adminKey }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 403) setKeyVerified(false)
        throw new Error(data.error ?? 'Request failed')
      }
      setKeyVerified(true)
      return data
    } finally {
      setPendingAction(null)
    }
  }

  async function doPushUrl(teamId: string | null, url: string, teamName?: string) {
    if (!url.trim()) return
    const full = url.startsWith('http') ? url : `https://${url}`
    try {
      await adminPost('/api/admin/push-url', teamId ? { teamId, url: full } : { url: full }, `push-${teamId}`)
      showToast(teamId ? `URL pushed to ${teamName}` : `URL pushed to all browsers`)
      setPushModal(null)
      if (!teamId) setBroadcastUrl('')
    } catch (e: unknown) { showToast((e as Error).message, false) }
  }

  async function doAnnounce(teamId: string | null, message: string, teamName?: string) {
    if (!message.trim()) return
    try {
      await adminPost('/api/admin/announce', teamId ? { teamId, message } : { message }, `announce-${teamId}`)
      showToast(teamId ? `Announced to ${teamName}` : 'Announced to all')
      setAnnounceModal(null)
      if (!teamId) setAnnounceMsg('')
    } catch (e: unknown) { showToast((e as Error).message, false) }
  }

  async function doLock(teamId: string | null, locked: boolean) {
    try {
      await adminPost('/api/admin/lock', teamId ? { teamId, locked } : { locked }, `lock-${teamId}`)
      showToast(locked ? (teamId ? 'Browser locked' : 'All browsers locked') : (teamId ? 'Browser unlocked' : 'All browsers unlocked'))
    } catch (e: unknown) { showToast((e as Error).message, false) }
  }

  async function doKick(teamId: string) {
    try {
      await adminPost('/api/admin/kick', { teamId }, `kick-${teamId}`)
      showToast('Team removed')
      setConfirmKick(null)
    } catch (e: unknown) { showToast((e as Error).message, false) }
  }

  async function doResetScores(teamId: string | null) {
    try {
      await adminPost('/api/admin/reset-scores', teamId ? { teamId } : {}, `reset-${teamId}`)
      showToast(teamId ? 'Score reset' : 'All scores reset')
    } catch (e: unknown) { showToast((e as Error).message, false) }
  }

  // Merge scores (all known teams) with live browser states
  const displayItems = scores.map(score => ({
    score,
    browser: browserStates.find(b => b.teamId === score.teamId) ?? null,
  }))
  for (const b of browserStates) {
    if (!displayItems.some(d => d.score.teamId === b.teamId)) {
      displayItems.push({
        score: {
          teamId: b.teamId, teamName: b.teamName, color: b.teamColor,
          totalPoints: 0, activeSeconds: 0, connectionsAttempted: 0,
          connectionsAllowed: 0, longestSession: 0, firstConnectBonus: false,
        },
        browser: b,
      })
    }
  }

  const onlineCount = browserStates.filter(b => b.online).length
  const lockedCount = browserStates.filter(b => b.locked).length
  const loadingCount = browserStates.filter(b => b.loading).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 20px',
        backgroundColor: '#111113',
        borderBottom: '0.5px solid rgba(84,84,88,0.5)',
        flexShrink: 0, flexWrap: 'wrap', rowGap: 8,
      }}>
        <Monitor size={16} color="#0A84FF" style={{ flexShrink: 0 }} />
        <div style={{ flex: '1 1 auto' }}>
          <div style={{ color: '#FFF', fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
            Browser Command Center
          </div>
          <div style={{ color: '#636366', fontSize: 11, marginTop: 1 }}>
            Monitor &amp; control all connected user browsers in real-time
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Chip value={displayItems.length} label="total" />
          <Chip value={onlineCount} label="online" color="#1DB814" />
          {lockedCount > 0 && <Chip value={lockedCount} label="locked" color="#FF9F0A" />}
          {loadingCount > 0 && <Chip value={loadingCount} label="loading" color="#0A84FF" />}
          {/* Admin key field */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            backgroundColor: '#1C1C1E',
            border: `0.5px solid ${keyVerified ? 'rgba(29,184,20,0.5)' : 'rgba(84,84,88,0.5)'}`,
            borderRadius: 8, padding: '5px 10px',
          }}>
            <KeyRound size={12} color={keyVerified ? '#1DB814' : '#636366'} style={{ flexShrink: 0 }} />
            <input
              type="password"
              placeholder="Admin key"
              value={adminKey}
              onChange={e => { setAdminKey(e.target.value); setKeyVerified(false) }}
              style={{
                width: 110, background: 'transparent', border: 'none', outline: 'none',
                color: '#FFF', fontSize: 12,
              }}
            />
            {keyVerified && <CheckCircle size={12} color="#1DB814" style={{ flexShrink: 0 }} />}
          </div>
        </div>
      </div>

      {/* ── Command bar ── */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        padding: '9px 16px',
        backgroundColor: '#0D0D0F',
        borderBottom: '0.5px solid rgba(84,84,88,0.3)',
        flexShrink: 0,
      }}>
        {/* Broadcast URL */}
        <div style={{ display: 'flex', gap: 6, flex: '1 1 260px', minWidth: 0 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
            backgroundColor: '#1C1C1E', borderRadius: 8,
            border: '0.5px solid rgba(84,84,88,0.4)',
            padding: '6px 10px',
          }}>
            <Globe size={11} color="#636366" style={{ flexShrink: 0 }} />
            <input
              type="url"
              placeholder="Broadcast URL to all browsers…"
              value={broadcastUrl}
              onChange={e => setBroadcastUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doPushUrl(null, broadcastUrl) }}
              style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: 12 }}
            />
          </div>
          <CmdBtn
            icon={<ArrowUpRight size={12} />}
            label="Push All"
            color="#0A84FF"
            disabled={!broadcastUrl.trim()}
            loading={pendingAction === 'push-null'}
            onClick={() => doPushUrl(null, broadcastUrl)}
          />
        </div>

        {/* Broadcast announce */}
        <div style={{ display: 'flex', gap: 6, flex: '1 1 240px', minWidth: 0 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
            backgroundColor: '#1C1C1E', borderRadius: 8,
            border: '0.5px solid rgba(84,84,88,0.4)',
            padding: '6px 10px',
          }}>
            <Megaphone size={11} color="#636366" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Broadcast message to all users…"
              value={announceMsg}
              onChange={e => setAnnounceMsg(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doAnnounce(null, announceMsg) }}
              style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: 12 }}
            />
          </div>
          <CmdBtn
            icon={<Send size={12} />}
            label="Send All"
            color="#FF9F0A"
            disabled={!announceMsg.trim()}
            loading={pendingAction === 'announce-null'}
            onClick={() => doAnnounce(null, announceMsg)}
          />
        </div>

        {/* Global controls */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          <CmdBtn icon={<Lock size={12} />} label="Lock All" color="#FF9F0A" loading={pendingAction === 'lock-null'} onClick={() => doLock(null, true)} />
          <CmdBtn icon={<Unlock size={12} />} label="Unlock All" color="#1DB814" loading={pendingAction === 'lock-null'} onClick={() => doLock(null, false)} />
          <CmdBtn icon={<RefreshCw size={12} />} label="Reset Scores" color="#FF453A" loading={pendingAction === 'reset-null'} onClick={() => doResetScores(null)} />
        </div>
      </div>

      {/* ── Browser grid ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
        {displayItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 12, alignContent: 'start',
          }}>
            {displayItems.map(({ score, browser }) => (
              <BrowserCard
                key={score.teamId}
                score={score}
                browser={browser}
                onPushUrl={() => setPushModal({ teamId: score.teamId, teamName: score.teamName, value: '' })}
                onAnnounce={() => setAnnounceModal({ teamId: score.teamId, teamName: score.teamName, value: '' })}
                onLock={() => doLock(score.teamId, !(browser?.locked ?? false))}
                onKick={() => setConfirmKick({ teamId: score.teamId, teamName: score.teamName })}
                onResetScore={() => doResetScores(score.teamId)}
                actionPending={pendingAction !== null}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          backgroundColor: toast.ok ? 'rgba(29,184,20,0.12)' : 'rgba(255,69,58,0.12)',
          border: `0.5px solid ${toast.ok ? 'rgba(29,184,20,0.4)' : 'rgba(255,69,58,0.4)'}`,
          borderRadius: 10, padding: '10px 16px',
          color: toast.ok ? '#1DB814' : '#FF453A',
          fontSize: 13, fontWeight: 500, zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 8,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {toast.ok
            ? <CheckCircle size={14} color="#1DB814" />
            : <AlertTriangle size={14} color="#FF453A" />
          }
          {toast.message}
        </div>
      )}

      {/* ── Push URL modal ── */}
      {pushModal && (
        <Modal title={`Push URL → ${pushModal.teamName}`} onClose={() => setPushModal(null)}>
          <input
            type="url"
            placeholder="https://example.com"
            value={pushModal.value}
            onChange={e => setPushModal({ ...pushModal, value: e.target.value })}
            onKeyDown={e => { if (e.key === 'Enter') doPushUrl(pushModal.teamId, pushModal.value, pushModal.teamName) }}
            autoFocus
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <ModalPrimary color="#0A84FF" loading={pendingAction !== null} onClick={() => doPushUrl(pushModal.teamId, pushModal.value, pushModal.teamName)}>
              Push URL
            </ModalPrimary>
            <ModalCancel onClick={() => setPushModal(null)} />
          </div>
        </Modal>
      )}

      {/* ── Announce modal ── */}
      {announceModal && (
        <Modal title={`Announce → ${announceModal.teamName}`} onClose={() => setAnnounceModal(null)}>
          <input
            type="text"
            placeholder="Message to display in user's browser…"
            value={announceModal.value}
            onChange={e => setAnnounceModal({ ...announceModal, value: e.target.value })}
            onKeyDown={e => { if (e.key === 'Enter') doAnnounce(announceModal.teamId, announceModal.value, announceModal.teamName) }}
            autoFocus
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <ModalPrimary color="#FF9F0A" loading={pendingAction !== null} onClick={() => doAnnounce(announceModal.teamId, announceModal.value, announceModal.teamName)}>
              Send Announcement
            </ModalPrimary>
            <ModalCancel onClick={() => setAnnounceModal(null)} />
          </div>
        </Modal>
      )}

      {/* ── Confirm kick ── */}
      {confirmKick && (
        <Modal title="Remove Team?" onClose={() => setConfirmKick(null)}>
          <div style={{
            backgroundColor: 'rgba(255,69,58,0.08)',
            border: '0.5px solid rgba(255,69,58,0.25)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 16,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <AlertTriangle size={15} color="#FF453A" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ color: '#FF453A', fontSize: 13, fontWeight: 600 }}>
                Remove <strong>{confirmKick.teamName}</strong>?
              </div>
              <div style={{ color: '#8E8E93', fontSize: 12, marginTop: 3 }}>
                This disconnects their browser and deletes all session data. Cannot be undone.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ModalPrimary color="#FF453A" loading={pendingAction !== null} onClick={() => doKick(confirmKick.teamId)}>
              Remove Team
            </ModalPrimary>
            <ModalCancel onClick={() => setConfirmKick(null)} />
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
