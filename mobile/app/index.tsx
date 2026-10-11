import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { SERVER_URL } from '../constants/config'
import { C, R, S, F, cardShadow, glowShadow } from '../constants/theme'

export default function Login() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function join() {
    const trimmed = name.trim()
    if (!trimmed) {
      Alert.alert('Enter team name', 'A team name is required to continue.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${SERVER_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      router.replace({
        pathname: '/(tabs)/connect',
        params: { teamId: data.team.id, teamName: data.team.name, teamColor: data.team.color },
      })
    } catch {
      Alert.alert('Connection error', `Cannot reach server at ${SERVER_URL}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Logo mark */}
      <View style={styles.logoBlock}>
        <View style={styles.logoIconRing}>
          <Text style={styles.logoIconText}>5G</Text>
        </View>
        <Text style={styles.logoName}>Tera5G</Text>
        <Text style={styles.logoSub}>Domain Fronting Assessment</Text>
      </View>

      {/* Join card */}
      <View style={[styles.card, cardShadow()]}>
        <Text style={styles.cardLabel}>TEAM NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your team name…"
          placeholderTextColor={C.muted}
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={join}
          returnKeyType="join"
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled, glowShadow(C.green)]}
          onPress={join}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#000000" size="small" />
            : <Text style={styles.btnText}>Join Assessment</Text>
          }
        </TouchableOpacity>

        <Text style={styles.cardNote}>
          If your team name already exists, you'll rejoin the same team.
        </Text>
      </View>

      <Text style={styles.hint}>{SERVER_URL}</Text>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: S.lg,
  },

  logoBlock: { alignItems: 'center', marginBottom: 40 },
  logoIconRing: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: C.greenBg,
    borderWidth: 0.5,
    borderColor: C.greenBd,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoIconText: {
    fontSize: 20,
    fontWeight: '800',
    color: C.green,
    fontFamily: F,
  },
  logoName: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.7,
    fontFamily: F,
  },
  logoSub: {
    fontSize: 13,
    color: C.sub,
    marginTop: 4,
    fontFamily: F,
  },

  card: {
    width: '100%',
    backgroundColor: C.surface,
    borderRadius: R.card,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 20,
    gap: S.md,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: F,
  },
  cardNote: {
    fontSize: 12,
    color: C.muted,
    lineHeight: 18,
    fontFamily: F,
  },

  input: {
    backgroundColor: C.elevated,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: R.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 15,
    fontFamily: F,
  },

  btn: {
    backgroundColor: C.green,
    borderRadius: R.button,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: F,
  },

  hint: {
    color: C.muted,
    fontSize: 11,
    marginTop: S.lg,
    fontFamily: F,
  },
})
