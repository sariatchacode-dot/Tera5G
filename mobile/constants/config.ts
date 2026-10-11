import { Platform } from 'react-native'

// On web: same origin (empty string = relative URLs work fine)
// On Android emulator: 10.0.2.2 maps to host machine
// On Android device / production: use EXPO_PUBLIC_SERVER_URL env var
export const SERVER_URL =
  Platform.OS === 'web'
    ? ''
    : (process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://10.0.2.2:3001').replace(/\/$/, '')

export const TARGET_HOSTS = [
  'blocked-streaming.com',
  'vpn-bypass.io',
  'unrestricted-media.net',
  'proxy-tunnel.org',
]
