import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSocket } from '../../hooks/useSocket'
import { C, R, S, F, cardShadow } from '../../constants/theme'

function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardTab() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>()
  const { scores, firewallMode } = useSocket()
  const bypassing = firewallMode === 'vulnerable'

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Firewall state banner */}
      <View style={[
        styles.banner,
        { backgroundColor: bypassing ? C.redBg : C.greenBg, borderColor: bypassing ? C.redBd : C.greenBd },
      ]}>
        <Ionicons
          name={bypassing ? 'shield-outline' : 'shield-checkmark-outline'}
          size={15}
          color={bypassing ? C.red : C.green}
        />
        <Text style={[styles.bannerText, { color: bypassing ? C.red : C.green }]}>
          {bypassing ? 'Firewall vulnerable — bypass active' : 'Firewall patched — connections blocked'}
        </Text>
      </View>

      {scores.length === 0 && (
        <Text style={styles.empty}>No teams yet — waiting for first connection</Text>
      )}

      {scores.map((entry, i) => {
        const isMe = entry.teamId === teamId
        const maxPts = scores[0]?.totalPoints ?? 1

        return (
          <View
            key={entry.teamId}
            style={[
              styles.card,
              cardShadow(),
              isMe && { borderColor: entry.color + '50' },
            ]}
          >
            <View style={styles.cardTop}>
              <View style={styles.rankRow}>
                <Text style={styles.medal}>{MEDALS[i] ?? `#${i + 1}`}</Text>
                <Text style={[styles.teamName, { color: entry.color }]} numberOfLines={1}>
                  {entry.teamName}
                </Text>
                {isMe && (
                  <View style={[styles.badge, { backgroundColor: entry.color + '18', borderColor: entry.color + '40' }]}>
                    <Text style={[styles.badgeText, { color: entry.color }]}>You</Text>
                  </View>
                )}
                {entry.firstConnectBonus && (
                  <View style={[styles.badge, { backgroundColor: C.yellowBg, borderColor: C.yellowBd }]}>
                    <Text style={[styles.badgeText, { color: C.yellow }]}>+15 first</Text>
                  </View>
                )}
              </View>

              {/* Points */}
              <View style={styles.ptsBox}>
                <Text style={styles.ptsValue}>{entry.totalPoints}</Text>
                <Text style={styles.ptsLabel}>pts</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.round((entry.totalPoints / maxPts) * 100)}%` as any, backgroundColor: entry.color },
                ]}
              />
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="time-outline" size={11} color={C.muted} />
                <Text style={styles.statText}>{fmtTime(entry.activeSeconds)}</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="radio-outline" size={11} color={C.muted} />
                <Text style={styles.statText}>{entry.connectionsAllowed}/{entry.connectionsAttempted}</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="trophy-outline" size={11} color={C.muted} />
                <Text style={styles.statText}>best {fmtTime(entry.longestSession)}</Text>
              </View>
            </View>
          </View>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  container: { padding: S.md, gap: 10, paddingBottom: 40 },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 0.5, borderRadius: R.input,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  bannerText: { fontSize: 13, fontWeight: '500', fontFamily: F },

  empty: { color: C.muted, textAlign: 'center', marginTop: 40, fontSize: 14, fontFamily: F },

  card: {
    backgroundColor: C.surface,
    borderWidth: 0.5, borderColor: C.border,
    borderRadius: R.card, padding: 16, gap: 10,
  },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  medal: { fontSize: 20 },
  teamName: { fontSize: 15, fontWeight: '600', flex: 1, fontFamily: F },

  badge: {
    borderWidth: 0.5, borderRadius: R.badge,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '600', fontFamily: F },

  ptsBox: { alignItems: 'flex-end' },
  ptsValue: {
    fontSize: 26, fontWeight: '700', color: C.text,
    letterSpacing: -0.8, fontFamily: F,
  },
  ptsLabel: { fontSize: 11, color: C.muted, fontFamily: F },

  barTrack: { height: 3, backgroundColor: C.divider, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: C.muted, fontSize: 11, fontFamily: F },
})
