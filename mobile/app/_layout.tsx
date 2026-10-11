import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { C, F } from '../constants/theme'

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor={C.header} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.header },
          headerTintColor: C.text,
          headerTitleStyle: { fontFamily: F, fontWeight: '600', fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: C.bg },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'Tera5G', headerShown: true }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}
