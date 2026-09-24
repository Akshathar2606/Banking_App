import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';

// ── Inner component: runs inside AuthProvider so it can read context ──────────

function RootLayoutNav() {
  const { token, isLoading } = useAuth();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return; // wait until secure-store read completes

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      // No session — send to login, replace so back button can't return here
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // Already authenticated — send to dashboard
      router.replace('/');
    }
    // All other combinations are fine: let Expo Router stay put
  }, [token, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index"  options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}

// ── Root layout: wraps everything with AuthProvider ───────────────────────────

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
