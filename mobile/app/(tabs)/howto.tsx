import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { C, R, S, F, iconBox } from '../../constants/theme'

const STEPS = [
  {
    icon: 'lock-closed-outline' as const,
    color: C.blue,
    title: 'TLS Handshake',
    body: 'Your device opens a TLS connection. The SNI (Server Name Indication) field in the ClientHello is visible in plaintext — this is what firewalls read to decide whether to allow the connection.',
  },
  {
    icon: 'eye-outline' as const,
    color: C.yellow,
    title: 'Firewall Inspection',
    body: 'A vulnerable firewall only reads the SNI field. If the SNI matches an allowed domain (e.g. free.telecom5g.com), it permits the connection without inspecting what is inside the encrypted tunnel.',
  },
  {
    icon: 'swap-horizontal-outline' as const,
    color: C.blue,
    title: 'Domain Fronting',
    body: 'Once the TLS tunnel is open, the HTTP Host header inside points to a different destination — the blocked site. The firewall sees an allowed SNI but traffic reaches the blocked server.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    color: C.green,
    title: 'Mitigation: JA3 Fingerprinting',
    body: 'A patched firewall computes a JA3 hash from TLS ClientHello parameters — version, cipher suites, extensions, curves. Hashes matching known domain-fronting tools are blocked regardless of SNI.',
  },
  {
    icon: 'git-compare-outline' as const,
    color: C.red,
    title: 'Mitigation: SNI / Host Correlation',
    body: 'The firewall correlates the TLS SNI with the HTTP Host header inside the tunnel. If they differ (SNI = allowed.com, Host = blocked.com), the connection is dropped.',
  },
]

const JA3_FIELDS = [
  { label: 'TLS Version', value: '772 (TLS 1.3)' },
  { label: 'Cipher Suites', value: '4866-4867-4865-…' },
  { label: 'Extensions', value: '0-23-10-11-35-…' },
  { label: 'Elliptic Curves', value: '29-23-24' },
  { label: 'EC Point Formats', value: '0' },
]

const FLOW_NODES = [
  { label: 'Your Device', color: C.blue, sub: 'SNI = allowed.com' },
  { label: 'Firewall', color: C.yellow, sub: 'Reads SNI only' },
  { label: 'CDN Edge', color: C.sub, sub: 'Forwards Host header' },
  { label: 'Blocked Site', color: C.red, sub: 'Actual destination' },
]

export default function HowTo() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>How Domain Fronting Works</Text>
      <Text style={styles.pageSubtitle}>
        A firewall bypass technique that exploits the gap between TLS metadata and the encrypted HTTP payload.
      </Text>

      {STEPS.map(step => (
        <View key={step.title} style={styles.stepCard}>
          <View style={iconBox(step.color)}>
            <Ionicons name={step.icon} size={17} color={step.color} />
          </View>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepBody}>{step.body}</Text>
        </View>
      ))}

      {/* JA3 breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>JA3 Fingerprint Anatomy</Text>
        <Text style={styles.sectionDesc}>
          JA3 = MD5(TLSVersion, Ciphers, Extensions, EllipticCurves, ECPointFormats)
        </Text>
        <View style={styles.table}>
          {JA3_FIELDS.map((f, idx) => (
            <View key={f.label} style={[styles.tableRow, idx < JA3_FIELDS.length - 1 && styles.tableRowBorder]}>
              <Text style={styles.tableLabel}>{f.label}</Text>
              <Text style={styles.tableValue}>{f.value}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.tableNote}>
          GREASE values (RFC 8701) are filtered before hashing for cross-implementation consistency.
        </Text>
      </View>

      {/* Traffic flow */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Attack Traffic Flow</Text>
        <View style={styles.flow}>
          {FLOW_NODES.map((node, i) => (
            <View key={node.label} style={styles.flowRow}>
              <View style={[styles.flowNode, { borderColor: node.color + '60', backgroundColor: node.color + '10' }]}>
                <Text style={[styles.flowNodeText, { color: node.color }]}>{node.label}</Text>
                <Text style={styles.flowNodeSub}>{node.sub}</Text>
              </View>
              {i < FLOW_NODES.length - 1 && (
                <Ionicons name="arrow-down-outline" size={16} color={C.muted} style={{ marginVertical: 4 }} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Technique: Domain Fronting · Protocol: TCP/443{'\n'}
          Detection: JA3 fingerprinting + SNI/Host correlation
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  container: { padding: S.md, gap: 12, paddingBottom: 40 },

  pageTitle: {
    fontSize: 22, fontWeight: '700', color: C.text,
    letterSpacing: -0.5, fontFamily: F,
  },
  pageSubtitle: {
    fontSize: 14, color: C.sub, lineHeight: 21,
    fontFamily: F,
  },

  stepCard: {
    backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border,
    borderRadius: R.card, padding: 18,
  },
  stepTitle: {
    fontSize: 15, fontWeight: '600', color: C.text,
    marginBottom: 6, fontFamily: F,
  },
  stepBody: { fontSize: 13, color: C.sub, lineHeight: 20, fontFamily: F },

  section: {
    backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border,
    borderRadius: R.card, padding: 18, gap: 12,
  },
  sectionLabel: {
    fontSize: 14, fontWeight: '600', color: C.text, fontFamily: F,
  },
  sectionDesc: { fontSize: 12, color: C.sub, fontFamily: F },

  table: { gap: 0 },
  tableRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10,
  },
  tableRowBorder: {
    borderBottomWidth: 0.5, borderBottomColor: C.divider,
  },
  tableLabel: { fontSize: 12, color: C.muted, fontFamily: F },
  tableValue: { fontSize: 12, color: C.text, fontFamily: F },
  tableNote:  { fontSize: 11, color: C.muted, lineHeight: 17, fontFamily: F },

  flow: { alignItems: 'center', gap: 0 },
  flowRow: { alignItems: 'center' },
  flowNode: {
    borderWidth: 0.5, borderRadius: R.input,
    paddingHorizontal: 20, paddingVertical: 10,
    alignItems: 'center', minWidth: 180,
  },
  flowNodeText: { fontSize: 13, fontWeight: '600', fontFamily: F },
  flowNodeSub: { fontSize: 11, color: C.muted, marginTop: 2, fontFamily: F },

  footer: {
    backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border,
    borderRadius: R.input, padding: 14,
  },
  footerText: { color: C.muted, fontSize: 12, lineHeight: 18, fontFamily: F },
})
