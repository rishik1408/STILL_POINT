// ============================================================
// STILL POINT Mobile Root Layout (Expo Router)
// Provides AuthProvider, global offline queue auto-sync on
// NetInfo reconnect, and Stone & Sage navigation chrome.
// ============================================================

import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { subscribeToOfflineAutoSync } from '@/lib/offline-queue';
import { processOfflineDraft } from '@/lib/offline-sync-processor';
import { COLORS } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading]);

  // Enforce route guard between /login and /(tabs)
  useEffect(() => {
    if (loading) return;
    const inTabs = segments[0] === '(tabs)';
    if (!user && inTabs) {
      router.replace('/login');
    } else if (user && segments[0] === 'login') {
      router.replace('/(tabs)/map');
    }
  }, [user, loading, segments, router]);

  // Background auto-sync for queued offline reports when connectivity returns
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToOfflineAutoSync(processOfflineDraft);
    return unsubscribe;
  }, [user]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.stone },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
