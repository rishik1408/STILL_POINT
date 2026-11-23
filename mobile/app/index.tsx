import React from 'react';
import { Redirect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/ui';
import { COLORS } from '@/theme/tokens';

export default function IndexScreen() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState message="Initializing STILL POINT..." />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/map" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.stone,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
