// ============================================================
// STILL POINT Citizen 4-Tab Bottom Navigation Layout
// Strictly Citizen-only tabs (Officials Portal remains web-only)
// Mirrors src/app/user/layout.tsx Stone & Sage theme verbatim.
// ============================================================

import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCheck,
  FolderKanban,
  LogOut,
  Map as MapIcon,
  PlusCircle,
} from 'lucide-react-native';
import { StillPointLogo } from '@/components/StillPointLogo';
import { useAuth } from '@/context/AuthContext';
import {
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  RADII,
} from '@/theme/tokens';

function CitizenTopBar() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out of STILL POINT',
      'Your saved offline drafts will remain intact on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <View style={styles.brandRow}>
        <StillPointLogo size="sm" variant="portal" color={COLORS.bark} irisColor={COLORS.clay} />
        <View>
          <Text style={styles.brandTitle}>STILL POINT</Text>
          <Text style={styles.brandSub}>
            {profile?.full_name ? profile.full_name.toUpperCase() : 'CITIZEN PORTAL'}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleSignOut}
        style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}
        accessibilityLabel="Sign Out"
      >
        <LogOut size={15} color={COLORS.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

export default function CitizenTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        header: () => <CitizenTopBar />,
        tabBarActiveTintColor: COLORS.clay,
        tabBarInactiveTintColor: COLORS.moss,
        tabBarStyle: {
          backgroundColor: COLORS.stone,
          borderTopColor: COLORS.linen,
          borderTopWidth: 1,
          height: 60 + Math.max(insets.bottom, 6),
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 10,
          fontWeight: FONT_WEIGHTS.semibold,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Sanctuary Map',
          tabBarIcon: ({ color, size }) => <MapIcon size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report Defect',
          tabBarIcon: ({ color, size }) => <PlusCircle size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="registry"
        options={{
          title: 'Asset Registry',
          tabBarIcon: ({ color, size }) => <FolderKanban size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="auditor"
        options={{
          title: 'Auditor & SLA',
          tabBarIcon: ({ color, size }) => <CheckCheck size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: COLORS.stone,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.linen,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
    letterSpacing: 2,
  },
  brandSub: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    color: COLORS.moss,
    letterSpacing: 1.1,
    marginTop: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(168, 72, 53, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168, 72, 53, 0.2)',
  },
  signOutText: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.dangerText,
  },
});
