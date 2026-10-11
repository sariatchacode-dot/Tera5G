import { useEffect } from 'react'
import { useSocket } from './hooks/useSocket'
import { Sidebar } from './components/Header'
import { TrafficFeed } from './components/TrafficFeed'
import { Leaderboard } from './components/Leaderboard'
import { FirewallControl } from './components/FirewallControl'
import { ActiveSessions } from './components/ActiveSessions'
import { JA3Inspector } from './components/JA3Inspector'

export default function App() {
  const {
    firewallMode,
    scores,
    traffic,
    activeSessions,
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

  return (
    <div className="flex h-screen bg-tera-bg overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        firewallMode={firewallMode}
        connected={connected}
        activeSessions={activeSessions.length}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Alert banner */}
        {alert && (
          <div
            className={`px-6 py-3 text-sm font-medium flex items-center justify-between border-b border-ios flex-shrink-0
              ${alert.type === 'patched'
                ? 'bg-tera-green/10 border-tera-green/30 text-tera-green'
                : 'bg-tera-red/10 border-tera-red/30 text-tera-red'
              }`}
          >
            <span>{alert.message}</span>
            <button
              onClick={clearAlert}
              className="text-xs opacity-60 hover:opacity-100 transition-opacity"
            >✕</button>
          </div>
        )}

        {/* Dashboard grid */}
        <div className="flex-1 grid grid-cols-[1fr_300px] grid-rows-[1fr_260px] gap-px overflow-hidden"
          style={{ background: 'rgba(84,84,88,0.36)' }}>

          {/* Traffic feed — tall left column */}
          <div className="row-span-2 bg-tera-bg p-5 overflow-hidden flex flex-col">
            <TrafficFeed entries={traffic} />
          </div>

          {/* Top-right: Active tunnels + Leaderboard */}
          <div className="bg-tera-bg p-5 overflow-hidden flex flex-col">
            <div className="grid grid-cols-2 gap-4 h-full overflow-hidden">
              <div className="overflow-hidden flex flex-col">
                <ActiveSessions sessions={activeSessions} />
              </div>
              <div className="overflow-hidden flex flex-col">
                <Leaderboard scores={scores} />
              </div>
            </div>
          </div>

          {/* Bottom-right: Firewall control + JA3 Inspector */}
          <div className="bg-tera-bg p-5 overflow-hidden">
            <div className="grid grid-cols-2 gap-4 h-full overflow-hidden">
              <div className="overflow-y-auto">
                <FirewallControl mode={firewallMode} />
              </div>
              <div className="overflow-hidden flex flex-col">
                <JA3Inspector entries={traffic} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
