import { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { WebView, WebViewNavigation } from 'react-native-webview'
import { useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SERVER_URL } from '../../constants/config'
import { useSocket } from '../../hooks/useSocket'
import { C, R, S, F } from '../../constants/theme'

const PRESET_SITES = [
  { label: 'HTTPBin', url: 'https://httpbin.org/get' },
  { label: 'Example', url: 'http://example.com' },
  { label: 'Speedtest', url: 'https://fast.com' },
  { label: 'Wikipedia', url: 'https://en.m.wikipedia.org/wiki/Main_Page' },
]

function relayUrl(targetUrl: string, teamId: string) {
  return `${SERVER_URL}/api/relay?teamId=${encodeURIComponent(teamId)}&url=${encodeURIComponent(targetUrl)}`
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
  const [currentRelayUrl, setCurrentRelayUrl] = useState(
    relayUrl('https://httpbin.org/get', teamId ?? '')
  )
  const [loading, setLoading] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const webViewRef = useRef<WebView>(null)

  const myScore = scores.find(s => s.teamId === teamId)
  const bypassing = firewallMode === 'vulnerable'

  // Register browser with server when socket connects
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

  // Admin: navigate to pushed URL
  useEffect(() => {
    if (adminPushUrl) {
      navigate(adminPushUrl)
      clearAdminPush()
    }
  }, [adminPushUrl])

  function navigate(url: string) {
    const clean = url.trim()
    if (!clean) return
    const full = clean.startsWith('http') ? clean : `https://${clean}`
    setInputUrl(full)
    setCurrentRelayUrl(relayUrl(full, teamId ?? ''))
  }

  const onNavStateChange = useCallback((navState: WebViewNavigation) => {
    setLoading(navState.loading)
    setCanGoBack(navState.canGoBack)
  }, [])

  const onShouldStartLoadWithRequest = useCallback((request: { url: string }) => {
    const { url } = request
    if (url.startsWith(SERVER_URL + '/api/relay')) return true
    if (url.startsWith('data:') || url.startsWith('about:')) return true
    if (url.startsWith('http://') || url.startsWith('https://')) {
      setCurrentRelayUrl(relayUrl(url, teamId ?? ''))
      setInputUrl(url)
      return false
    }
    return true
  }, [teamId])

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

      {/* Locked banner */}
      {browserLocked && (
        <View style={styles.lockedBanner}>
          <Ionicons name="lock-closed" size={11} color={C.yellow} />
          <Text style={styles.lockedText}>Browser locked by admin</Text>
        </View>
      )}

      {/* Alert banner */}
      {alert && (
        <TouchableOpacity style={styles.alertBanner} onPress={clearAlert}>
          <Ionicons name="warning-outline" size={13} color={C.yellow} />
          <Text style={styles.alertText} numberOfLines={1}>{alert}</Text>
        </TouchableOpacity>
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
      </View>

      {/* URL bar */}
      <View style={styles.urlBar}>
        <TouchableOpacity
          onPress={() => canGoBack && webViewRef.current?.goBack()}
          disabled={!canGoBack}
          style={[styles.navBtn, { opacity: canGoBack ? 1 : 0.3 }]}
        >
          <Ionicons name="chevron-back" size={18} color={C.sub} />
        </TouchableOpacity>

        <View style={[styles.urlInputWrapper, browserLocked && styles.urlInputLocked]}>
          <Ionicons
            name={browserLocked ? 'lock-closed' : 'lock-closed-outline'}
            size={11}
            color={browserLocked ? C.yellow : C.muted}
          />
          <TextInput
            style={styles.urlInput}
            value={inputUrl}
            onChangeText={setInputUrl}
            onSubmitEditing={() => navigate(inputUrl)}
            returnKeyType="go"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            selectTextOnFocus
            placeholder="Enter a URL…"
            placeholderTextColor={C.muted}
            editable={!browserLocked}
          />
        </View>

        <TouchableOpacity
          style={[styles.goBtn, browserLocked && { opacity: 0.4 }]}
          onPress={browserLocked ? undefined : () => navigate(inputUrl)}
          disabled={browserLocked}
        >
          {loading
            ? <ActivityIndicator size="small" color="#000000" />
            : <Text style={styles.goBtnText}>Go</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Quick access sites */}
      <View style={styles.presets}>
        {PRESET_SITES.map(site => (
          <TouchableOpacity
            key={site.url}
            style={styles.presetChip}
            onPress={() => navigate(site.url)}
          >
            <Text style={styles.presetText}>{site.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: currentRelayUrl }}
        style={styles.webview}
        onNavigationStateChange={onNavStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={C.green} size="large" />
            <Text style={styles.loadingText}>Routing through tunnel…</Text>
          </View>
        )}
        renderError={(errorDomain, errorCode) => (
          <View style={styles.errorOverlay}>
            <View style={styles.errorIconBox}>
              <Ionicons name="alert-circle-outline" size={28} color={C.red} />
            </View>
            <Text style={styles.errorTitle}>Unable to connect</Text>
            <Text style={styles.errorBody}>
              {errorCode === -1 ? 'Cannot reach the relay server.' : `Error ${errorCode}: ${errorDomain}`}
            </Text>
          </View>
        )}
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

  lockedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,159,10,0.10)',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,159,10,0.3)',
    paddingHorizontal: 14, paddingVertical: 6,
  },
  lockedText: { color: C.yellow, fontSize: 11, fontWeight: '600', fontFamily: F },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.yellowBg,
    borderBottomWidth: 0.5, borderBottomColor: C.yellowBd,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  alertText: { flex: 1, color: C.yellow, fontSize: 12, fontFamily: F },

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
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.surface,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  navBtn: { padding: 4 },
  urlInputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.elevated,
    borderWidth: 0.5, borderColor: C.border,
    borderRadius: R.input,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  urlInputLocked: {
    borderColor: 'rgba(255,159,10,0.4)',
    backgroundColor: 'rgba(255,159,10,0.06)',
  },
  urlInput: {
    flex: 1, color: C.text, fontSize: 13, fontFamily: F,
  },
  goBtn: {
    backgroundColor: C.green, borderRadius: R.button,
    paddingHorizontal: 14, paddingVertical: 8,
    minWidth: 48, alignItems: 'center',
  },
  goBtnText: { color: '#000000', fontWeight: '700', fontSize: 13, fontFamily: F },

  presets: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
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

  webview: { flex: 1, backgroundColor: C.bg },

  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  loadingText: { color: C.sub, fontSize: 13, fontFamily: F },

  errorOverlay: {
    flex: 1, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
    padding: S.xl, gap: S.md,
  },
  errorIconBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: C.redBg, borderWidth: 0.5, borderColor: C.redBd,
    alignItems: 'center', justifyContent: 'center',
  },
  errorTitle: { color: C.text, fontSize: 17, fontWeight: '600', fontFamily: F },
  errorBody:  { color: C.sub, fontSize: 13, textAlign: 'center', fontFamily: F, lineHeight: 20 },
})
