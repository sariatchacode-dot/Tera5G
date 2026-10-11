import { Wifi, WifiOff, ShieldCheck, ShieldAlert, Radio, Trophy, Info, LayoutDashboard } from 'lucide-react'
import { FirewallMode } from '../types'

interface Props {
  firewallMode: FirewallMode
  connected: boolean
  activeSessions: number
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Radio,           label: 'Traffic' },
  { icon: Trophy,          label: 'Leaderboard' },
  { icon: ShieldAlert,     label: 'Firewall' },
  { icon: Info,            label: 'JA3' },
]

export function Sidebar({ firewallMode, connected, activeSessions }: Props) {
  const isVulnerable = firewallMode === 'vulnerable'

  return (
    <aside
      className="flex flex-col flex-shrink-0 overflow-hidden"
      style={{
        width: 240,
        backgroundColor: '#1C1C1E',
        borderRight: '0.5px solid rgba(84,84,88,0.50)',
      }}
    >
      {/* Brand */}
      <div
        className="flex flex-col gap-0.5"
        style={{
          paddingInline: 18,
          paddingTop: 24,
          paddingBottom: 18,
          borderBottom: '0.5px solid rgba(84,84,88,0.50)',
        }}
      >
        <span className="text-xl font-bold text-tera-text tracking-tight leading-none">
          Tera<span className="text-tera-green">5G</span>
        </span>
        <span className="text-xs text-tera-muted mt-1">
          Domain Fronting Assessment
        </span>
      </div>

      {/* Status indicators */}
      <div
        className="flex flex-col gap-2"
        style={{ padding: '14px 14px 8px' }}
      >
        {/* Firewall state */}
        <div
          className="flex items-center gap-2.5 rounded-ios"
          style={{
            padding: '10px 12px',
            backgroundColor: isVulnerable ? 'rgba(255,69,58,0.10)' : 'rgba(29,184,20,0.10)',
            border: `0.5px solid ${isVulnerable ? 'rgba(255,69,58,0.35)' : 'rgba(29,184,20,0.35)'}`,
          }}
        >
          {isVulnerable
            ? <ShieldAlert size={14} className="text-tera-red flex-shrink-0" />
            : <ShieldCheck size={14} className="text-tera-green flex-shrink-0" />
          }
          <div className="min-w-0">
            <div className={`text-xs font-semibold ${isVulnerable ? 'text-tera-red' : 'text-tera-green'}`}>
              {isVulnerable ? 'Bypass Active' : 'Firewall Patched'}
            </div>
            <div className="text-xs text-tera-muted truncate">
              {isVulnerable ? 'SNI-only inspection' : 'JA3 + SNI/Host check'}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className="flex flex-col items-center rounded-ios py-2"
            style={{ backgroundColor: 'rgba(84,84,88,0.12)', border: '0.5px solid rgba(84,84,88,0.36)' }}
          >
            <span className="text-base font-bold text-tera-text leading-none">{activeSessions}</span>
            <span className="text-xs text-tera-muted mt-0.5">active</span>
          </div>
          <div
            className="flex items-center justify-center gap-1.5 rounded-ios py-2"
            style={{ backgroundColor: 'rgba(84,84,88,0.12)', border: '0.5px solid rgba(84,84,88,0.36)' }}
          >
            {connected
              ? <Wifi size={12} className="text-tera-green" />
              : <WifiOff size={12} className="text-tera-red" />
            }
            <span className={`text-xs font-semibold ${connected ? 'text-tera-green' : 'text-tera-red'}`}>
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div
        className="text-xs font-semibold text-tera-muted uppercase tracking-widest"
        style={{ paddingInline: 22, paddingBlock: '10px 6px' }}
      >
        Panels
      </div>

      {/* Nav items */}
      <nav className="flex-1" style={{ paddingInline: 8 }}>
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon
          const active = idx === 0
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-ios cursor-default"
              style={{
                paddingInline: 14,
                paddingBlock: 10,
                marginBottom: 2,
                backgroundColor: active ? 'rgba(255,255,255,0.09)' : 'transparent',
              }}
            >
              <Icon
                size={17}
                className={active ? 'text-tera-text' : 'text-tera-muted'}
              />
              <span
                className="text-sm"
                style={{ color: active ? '#FFFFFF' : '#636366', fontWeight: active ? 600 : 400 }}
              >
                {item.label}
              </span>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        className="flex flex-col gap-1"
        style={{
          paddingInline: 14,
          paddingBlock: 14,
          borderTop: '0.5px solid rgba(84,84,88,0.50)',
        }}
      >
        <div
          className="flex items-center gap-2 rounded-ios"
          style={{ padding: '8px 10px', backgroundColor: 'rgba(29,184,20,0.08)' }}
        >
          <div
            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(29,184,20,0.18)', borderRadius: 6 }}
          >
            <ShieldCheck size={12} className="text-tera-green" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-tera-text truncate">Admin</div>
            <div className="text-xs text-tera-muted truncate">NOC Dashboard</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
