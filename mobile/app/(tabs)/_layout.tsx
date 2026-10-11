import { Tabs, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { C, F } from '../../constants/theme'

export default function TabsLayout() {
  const params = useLocalSearchParams<{ teamId: string; teamName: string; teamColor: string }>()

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.header },
        headerTintColor: C.text,
        headerTitleStyle: { fontFamily: F, fontWeight: '600', fontSize: 17, letterSpacing: -0.3 },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          borderTopWidth: 0.5,
          height: 56,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: C.green,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 10, fontFamily: F, fontWeight: '500', letterSpacing: 0.1 },
      }}
    >
      <Tabs.Screen
        name="connect"
        initialParams={params}
        options={{
          title: 'Browser',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="globe-outline" size={size} color={color} />
          ),
          headerTitle: params.teamName ? `${params.teamName} · Bypass` : 'Bypass Browser',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        initialParams={params}
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" size={size} color={color} />
          ),
          headerTitle: 'Leaderboard',
        }}
      />
      <Tabs.Screen
        name="howto"
        options={{
          title: 'How It Works',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle-outline" size={size} color={color} />
          ),
          headerTitle: 'How It Works',
        }}
      />
    </Tabs>
  )
}
