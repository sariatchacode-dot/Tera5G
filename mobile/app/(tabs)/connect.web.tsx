import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SERVER_URL } from '../../constants/config'
import { useSocket } from '../../hooks/useSocket'
import { C, R, S, F } from '../../constants/theme'

const PRESET_SITES = [
  { label: 'HTTPBin', url: 'https://httpbin.org/get' },
  { label: 'Example', url: 'http://example.com' },
  { label: 'Wikipedia', url: 'https://en.m.wikipedia.org/wiki/Main_Page' },
  { label: 'Speedtest', url: 'https://fast.com' },
  { label: 'News', url: 'https://lite.cnn.com' },
]

function buildRelay(url: string, teamId: string) {
  return `${SERVER_URL}/api/relay?teamId=${encodeURIComponent(teamId)}&url=${encodeURIComponent(url)}`
}

export default function BrowserTab() {
  const { teamId, teamName, teamColor } = useLocalSearchParams<{
    teamId: string; teamName: string; teamColor: string
  }>()
  const {
    firewallMode, scores, connected, alert, clearAlert,
    adminPushUrl, clearAdminPush, emitBrowserRegister, emitBrowserState,
    browserLocked, kicked,
  } = useSocket()

  const [inputUrl, setInputUrl] = useState('https://httpbin.org/get')
  const [relayUrl, setRelayUrl] = useState(buildRelay('https://httpbin.org/get', teamId ?? ''))
  const [loading, setLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const myScore = scores.find(s => s.teamId === teamId)
  const bypassing = firewallMode === 'vulnerable'

  // Register with server whenever socket connects
  useEffect(() => {
    if (connected && teamId) emitBrowserRegister(teamId)
  }, [connected, teamId])

  // Report browser state to admin (debounced)
  useEffect(() => {
    if (!connected || !teamId) return
    const t = setTimeout(() => {
      emitBrowserState({ teamId, url: inputUrl, title: '', loading })
    }, 400)
    return () => clearTimeout(t)
  }, [inputUrl, loading, connected, teamId])

  // Admin: navigate browser to pushed URL
  useEffect(() => {
    if (adminPushUrl) {
      navigate(adminPushUrl)
      clearAdminPush()
    }
  }, [adminPushUrl])

  function navigate(url: string) {
    const clean = url.trim()
    if (!clean || browserLocked) return
    const full = clean.startsWith('http') ? clean : `https://${clean}`
    setInputUrl(full)
    setRelayUrl(buildRelay(full, teamId ?? ''))
    setLoading(true)
  }

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    function onLoad() {
      setLoading(false)
      try {
        const doc = iframe!.contentDocument
        if (!doc) return
        doc.addEventListener('click', (e) => {
          const el = (e.target as HTMLElement).closest('a') as HTMLAnchorElement | null
          if (!el?.href) return
          if ((el.href.startsWith('http://') || el.href.startsWith('https://')) && !browserLocked) {
            e.preventDefault()
            navigate(el.href)
          }
        })
      } catch {
        // cross-origin
      }
    }
    iframe.addEventListener('load', onLoad)
    return () => iframe.removeEventListener('load', onLoad)
  }, [relayUrl, teamId, browserLocked])

  return (
    <View style={styles.container}>
      {/* Kicked overlay */}
      {kicked && (
        <View style={styles.kickedOverlay}>
          <Ionicons name="ban-outline" size={52} color={C.red} />
          <Text style={styles.kickedTitle}>Session Ended</Text>
          <Text style={styles.kickedBody}>The admin has ended your session.</Text>
        </View>
      )}

      {/* Alert banner */}
      {alert && (
        <TouchableOpacity style={styles.alertBanner} onPress={clearAlert}>
          <Ionicons name="warning-outline" size={13} color={C.yellow} />
          <Text style={styles.alertText}>{alert}</Text>
        </TouchableOpacity>
      )}

      {/* Locked banner */}
      {browserLocked && (
        <View style={styles.lockedBanner}>
          <Ionicons name="lock-closed" size={11} color={C.yellow} />
          <Text style={styles.lockedText}>Browser locked by admin</Text>
        </View>
      )}

      {/* Status bar */}
      <View style={styles.statusRow}>
        <View style={[
          styles.statusPill,
          { backgroundColor: bypassing ? C.redBg : C.greenBg, borderColor: bypassing ? C.redBd : C.greenBd },
        ]}>
          <View style={[styles.dot, { backgroundColor: bypassing ? C.red : C.green }]} />
          <Text style={[styles.statusText, { color: bypassing ? C.red : C.green }]}>
            {bypassing ? 'Bypass Active' : 'Connection Blocked'}
          </Text>
        </View>

        <View style={[
          styles.statusPill,
          { backgroundColor: connected ? C.greenBg : C.redBg, borderColor: connected ? C.greenBd : C.redBd },
        ]}>
          <View style={[styles.dot, { backgroundColor: connected ? C.green : C.red }]} />
          <Text style={[styles.statusText, { color: connected ? C.green : C.red }]}>
            {connected ? 'Live' : 'Offline'}
          </Text>
        </View>

        {myScore && (
          <View style={[styles.statusPill, { backgroundColor: C.blueBg, borderColor: C.blueBd }]}>
            <Text style={[styles.statusText, { color: C.blue }]}>
              {myScore.totalPoints} pts
            </Text>
          </View>
        )}

        {teamName && (
          <View style={[styles.statusPill, { backgroundColor: (teamColor as string) + '18', borderColor: (teamColor as string) + '40' }]}>
            <Text style={[styles.statusText, { color: teamColor as string }]}>{teamName}</Text>
          </View>
        )}
      </View>

      {/* URL bar */}
      <View style={styles.urlBar}>
        <View style={[styles.urlInputWrapper, browserLocked && styles.urlInputLocked]}>
          <Ionicons
            name={browserLocked ? 'lock-closed' : 'lock-closed-outline'}
            size={12}
            color={browserLocked ? C.yellow : C.muted}
          />
          <TextInput
            style={styles.urlInput}
            value={inputUrl}
            onChangeText={setInputUrl}
            // @ts-ignore
            onKeyPress={(e: React.KeyboardEvent) => { if (e.key === 'Enter') navigate(inputUrl) }}
            placeholder="Enter a URL to access through the tunnel…"
            placeholderTextColor={C.muted}
            // @ts-ignore
            autoCapitalize="none"
            autoCorrect={false}
            editable={!browserLocked}
          />
        </View>
        <TouchableOpacity
          style={[styles.goBtn, browserLocked && styles.goBtnDisabled]}
          onPress={browserLocked ? undefined : () => navigate(inputUrl)}
          disabled={browserLocked}
        >
          {loading
            ? <ActivityIndicator size="small" color="#000000" />
            : <Text style={styles.goBtnText}>Go</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Presets */}
      {!browserLocked && (
        <View style={styles.presets}>
          {PRESET_SITES.map(s => (
            <TouchableOpacity key={s.url} style={styles.presetChip} onPress={() => navigate(s.url)}>
              <Text style={styles.presetText}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Iframe browser */}
      {/* @ts-ignore */}
      <iframe
        ref={iframeRef}
        src={relayUrl}
        style={{
          flex: 1, width: '100%', border: 'none', backgroundColor: C.bg, display: 'flex',
        } as object}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        title="Tera5G Bypass Browser"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  kickedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
    backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  kickedTitle: { color: C.text, fontSize: 20, fontWeight: '700', fontFamily: F },
  kickedBody: { color: C.sub, fontSize: 14, fontFamily: F, textAlign: 'center' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.yellowBg,
    borderBottomWidth: 0.5, borderBottomColor: C.yellowBd,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  alertText: { flex: 1, color: C.yellow, fontSize: 12, fontFamily: F },

  lockedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,159,10,0.10)',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,159,10,0.3)',
    paddingHorizontal: 14, paddingVertical: 6,
  },
  lockedText: { color: C.yellow, fontSize: 11, fontWeight: '600', fontFamily: F },

  statusRow: {
    flexDirection: 'row', gap: 6, flexWrap: 'wrap',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 0.5, borderRadius: R.chip,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600', fontFamily: F },

  urlBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.surface,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  urlInputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.elevated,
    borderWidth: 0.5, borderColor: C.border,
    borderRadius: R.input,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  urlInputLocked: {
    borderColor: 'rgba(255,159,10,0.4)',
    backgroundColor: 'rgba(255,159,10,0.06)',
  },
  urlInput: {
    flex: 1, color: C.text, fontSize: 13, fontFamily: F,
    // @ts-ignore
    outlineStyle: 'none',
  },
  goBtn: {
    backgroundColor: C.green, borderRadius: R.button,
    paddingHorizontal: 16, paddingVertical: 9,
    minWidth: 52, alignItems: 'center',
  },
  goBtnDisabled: { opacity: 0.4 },
  goBtnText: { color: '#000000', fontWeight: '700', fontSize: 13, fontFamily: F },

  presets: {
    flexDirection: 'row', gap: 6, flexWrap: 'wrap',
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.surface,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  presetChip: {
    borderWidth: 0.5, borderColor: C.border,
    borderRadius: R.chip,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: C.elevated,
  },
  presetText: { color: C.sub, fontSize: 11, fontWeight: '500', fontFamily: F },
})
