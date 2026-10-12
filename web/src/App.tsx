import { useState, useEffect } from 'react'
import { useSocket } from './hooks/useSocket'
import { Sidebar } from './components/Header'
import { TrafficFeed } from './components/TrafficFeed'
import { Leaderboard } from './components/Leaderboard'
import { FirewallControl } from './components/FirewallControl'
import { ActiveSessions } from './components/ActiveSessions'
import { JA3Inspector } from './components/JA3Inspector'
import { BrowserGrid } from './components/BrowserGrid'

export type Section = 'browsers' | 'dashboard' | 'traffic' | 'leaderboard' | 'firewall' | 'ja3'

export default function App() {
  const [section, setSection] = useState<Section>('browsers')
  const {
    firewallMode,
    scores,
    traffic,
    activeSessions,
    browserStates,
    alert,
    connected,
    clearAlert,
  } = useSocket()

  useEffect(() => {
    if (alert) {
      const t = setTimeout(clearAlert, 6000)
      return () => clearTimeout(t)
    }
  }, [alert])

  const onlineBrowsers = browserStates.filter(b => b.online).length

  return (
    <div className="flex h-screen bg-tera-bg overflow-hidden">
      <Sidebar
        firewallMode={firewallMode}
        connected={connected}
        activeSessions={activeSessions.length}
        onlineBrowsers={onlineBrowsers}
        activeSection={section}
        onNavigate={setSection}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Alert banner */}
        {alert && (
          <div
            className={`px-6 py-3 text-sm font-medium flex items-center justify-between border-b flex-shrink-0
              ${alert.type === 'patched'
                ? 'bg-tera-green/10 border-tera-green/30 text-tera-green'
                : 'bg-tera-red/10 border-tera-red/30 text-tera-red'
              }`}
          >
            <span>{alert.message}</span>
            <button
              onClick={clearAlert}
              className="text-xs opacity-60 hover:opacity-100 transition-opacity ml-4"
            >✕</button>
          </div>
        )}

        {/* Section content */}
        <div className="flex-1 overflow-hidden">

          {/* ── Browsers (primary) ── */}
          {section === 'browsers' && (
            <div className="h-full overflow-hidden">
              <BrowserGrid browserStates={browserStates} scores={scores} />
            </div>
          )}

          {/* ── Dashboard ── */}
          {section === 'dashboard' && (
            <div className="h-full grid grid-cols-[1fr_320px] gap-px" style={{ background: 'rgba(84,84,88,0.36)' }}>
              <div className="bg-tera-bg p-5 overflow-hidden flex flex-col">
                <TrafficFeed entries={traffic} />
              </div>
              <div className="bg-tera-bg flex flex-col overflow-hidden">
                <div className="flex-1 p-5 overflow-hidden flex flex-col border-b" style={{ borderColor: 'rgba(84,84,88,0.36)' }}>
                  <ActiveSessions sessions={activeSessions} />
                </div>
                <div className="flex-1 p-5 overflow-hidden flex flex-col">
                  <Leaderboard scores={scores} />
                </div>
              </div>
            </div>
          )}

          {/* ── Traffic ── */}
          {section === 'traffic' && (
            <div className="h-full bg-tera-bg p-6 overflow-hidden flex flex-col">
              <TrafficFeed entries={traffic} />
            </div>
          )}

          {/* ── Leaderboard ── */}
          {section === 'leaderboard' && (
            <div className="h-full bg-tera-bg p-6 overflow-y-auto">
              <div className="max-w-xl mx-auto">
                <Leaderboard scores={scores} />
              </div>
            </div>
          )}

          {/* ── Firewall ── */}
          {section === 'firewall' && (
            <div className="h-full bg-tera-bg p-6 overflow-y-auto">
              <div className="max-w-md mx-auto">
                <FirewallControl mode={firewallMode} />
              </div>
            </div>
          )}

          {/* ── JA3 Inspector ── */}
          {section === 'ja3' && (
            <div className="h-full bg-tera-bg p-6 overflow-hidden flex flex-col">
              <JA3Inspector entries={traffic} />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
