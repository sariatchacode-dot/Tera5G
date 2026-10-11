import { Platform } from 'react-native'

// ── PS360 Admin palette ──────────────────────────────────────────────────────
export const C = {
  bg:       '#000000',
  surface:  '#1C1C1E',
  elevated: '#2C2C2E',
  header:   '#1C1C1E',

  border:   'rgba(84,84,88,0.65)',
  divider:  'rgba(84,84,88,0.36)',

  text:     '#FFFFFF',
  sub:      '#8E8E93',
  muted:    '#636366',

  green:    '#1DB814',
  greenBg:  'rgba(29,184,20,0.12)',
  greenBd:  'rgba(29,184,20,0.28)',
  greenGlow:'rgba(29,184,20,0.35)',

  red:      '#FF453A',
  redBg:    'rgba(255,69,58,0.12)',
  redBd:    'rgba(255,69,58,0.28)',

  blue:     '#0A84FF',
  blueBg:   'rgba(10,132,255,0.12)',
  blueBd:   'rgba(10,132,255,0.28)',

  yellow:   '#FF9F0A',
  yellowBg: 'rgba(255,159,10,0.12)',
  yellowBd: 'rgba(255,159,10,0.30)',
} as const

// ── Radii ────────────────────────────────────────────────────────────────────
export const R = {
  card:   18,
  button: 12,
  chip:   20,
  input:  10,
  badge:  20,
  icon:   10,
  sm:     8,
} as const

// ── Spacing ──────────────────────────────────────────────────────────────────
export const S = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const

// ── Font family (iOS SF Pro, Android system sans) ─────────────────────────────
export const F = Platform.OS === 'ios' ? 'SF Pro Text' : undefined

// ── Standard card shadow ──────────────────────────────────────────────────────
export function cardShadow() {
  return Platform.OS === 'ios'
    ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }
    : { elevation: 2 }
}

// ── Colored glow shadow ───────────────────────────────────────────────────────
export function glowShadow(color: string) {
  return Platform.OS === 'ios'
    ? { shadowColor: color, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }
    : { elevation: 6 }
}

// ── Surface card ──────────────────────────────────────────────────────────────
export const surfaceCard = {
  backgroundColor: C.surface,
  borderWidth: 0.5,
  borderColor: C.border,
  borderRadius: R.card,
  padding: 18,
}

export const surfaceCardActive = {
  ...surfaceCard,
  borderColor: `${C.green}40`,
}

export const surfaceCardDanger = {
  ...surfaceCard,
  borderColor: `${C.red}40`,
}

// ── Stat card icon container ──────────────────────────────────────────────────
export function iconBox(accentColor: string) {
  return {
    width: 36,
    height: 36,
    borderRadius: R.icon,
    backgroundColor: accentColor + '18',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  }
}
