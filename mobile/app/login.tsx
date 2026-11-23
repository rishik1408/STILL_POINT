// ============================================================
// STILL POINT Mobile Authentication Screen
// Connected to Supabase Auth with expo-secure-store persistence.
// Strictly blocks 'official' role accounts and directs them to
// the STILL POINT desktop web portal.
// ============================================================

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Lock,
  Mail,
  Monitor,
  ShieldAlert,
  User,
} from 'lucide-react-native';
import { StillPointLogo } from '@/components/StillPointLogo';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/config';
import {
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  RADII,
  SPACING,
} from '@/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const {
    signInWithPassword,
    signUpCitizen,
    officialBlockNotice,
    clearOfficialBlockNotice,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabaseReady = isSupabaseConfigured();

  const handleSubmit = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    clearOfficialBlockNotice();

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    if (mode === 'signup' && !fullName.trim()) {
      setErrorMsg('Please enter your full name to create a Citizen account.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const res = await signInWithPassword(email, password);
        if (res.blockedOfficial) {
          // Official role guard notice is rendered automatically from AuthContext
          return;
        }
        if (res.error) {
          setErrorMsg(res.error);
          return;
        }
        router.replace('/(tabs)/map');
      } else {
        const res = await signUpCitizen(email, password, fullName);
        if (res.error) {
          setErrorMsg(res.error);
          return;
        }
        if (res.needsConfirmation) {
          setSuccessMsg(
            'Citizen account registered. Please verify your email inbox to complete sign-in.'
          );
          setMode('signin');
          return;
        }
        router.replace('/(tabs)/map');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Architectural Brand Header (mirrors left column of src/app/login/page.tsx) */}
          <View style={styles.heroBanner}>
            <View style={styles.heroTopRow}>
              <StillPointLogo
                size="md"
                variant="portal"
                color={COLORS.stone}
                irisColor={COLORS.clay}
                showWordmark
                subtitle="CITIZEN MOBILE"
                wordmarkColor={COLORS.stone}
                subtitleColor={COLORS.sage}
              />
              <View style={styles.pillDark}>
                <View style={styles.pillDot} />
                <Text style={styles.pillText}>PIAMS</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>
              Order & Stillness in Urban Stewardship.
            </Text>
            <Text style={styles.heroSubtitle}>
              Capture infrastructure defects in the field with GPS coordinates, verify AI triage,
              track municipal ward routing, and audit completed repairs.
            </Text>

            <View style={styles.heroFeatureCard}>
              <Compass size={16} color={COLORS.clay} />
              <View style={styles.flex}>
                <Text style={styles.heroFeatureTitle}>PUBLIC CITIZEN EDITION</Text>
                <Text style={styles.heroFeatureDesc}>
                  Offline-ready camera reporting, GIS asset ledger, and before/after AI resolution audits.
                </Text>
              </View>
            </View>
          </View>

          {/* Official Role Guard Block Notice */}
          {officialBlockNotice ? (
            <View style={styles.officialBlockCard}>
              <View style={styles.officialBlockHeader}>
                <View style={styles.officialIconBox}>
                  <ShieldAlert size={20} color={COLORS.stone} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.officialEyebrow}>ACCESS RESTRICTED — OFFICIAL ROLE</Text>
                  <Text style={styles.officialTitle}>{officialBlockNotice.title}</Text>
                </View>
              </View>

              <Text style={styles.officialMessage}>{officialBlockNotice.message}</Text>

              <View style={styles.desktopHintBox}>
                <Monitor size={15} color={COLORS.clay} />
                <Text style={styles.desktopHintText}>
                  Sign in at the STILL POINT desktop web portal to access the Officials Operator Dashboard (/official).
                </Text>
              </View>

              <Button
                title="Dismiss & Sign In as Citizen"
                variant="outline"
                size="sm"
                onPress={clearOfficialBlockNotice}
                style={styles.dismissBtn}
              />
            </View>
          ) : null}

          {/* Environment notice when .env is not populated yet */}
          {!supabaseReady ? (
            <View style={styles.envNotice}>
              <AlertCircle size={15} color={COLORS.clayText} />
              <Text style={styles.envNoticeText}>
                Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env to authenticate with your Supabase project.
              </Text>
            </View>
          ) : null}

          {/* Auth Form Card */}
          <Card style={styles.formCard}>
            {/* Mode Tabs */}
            <View style={styles.tabBar}>
              <Pressable
                onPress={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                style={[styles.tabItem, mode === 'signin' && styles.tabItemActive]}
              >
                <Text
                  style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}
                >
                  Sign In to Account
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                style={[styles.tabItem, mode === 'signup' && styles.tabItemActive]}
              >
                <Text
                  style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}
                >
                  Create Citizen Account
                </Text>
              </Pressable>
            </View>

            {/* Error Banner */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color={COLORS.danger} />
                <Text style={styles.errorText}>
                  <Text style={styles.errorBold}>Authentication Notice: </Text>
                  {errorMsg}
                </Text>
              </View>
            ) : null}

            {/* Success Banner */}
            {successMsg ? (
              <View style={styles.successBox}>
                <CheckCircle2 size={16} color={COLORS.moss} />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {/* Inputs */}
            <View style={styles.fields}>
              {mode === 'signup' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={styles.inputRow}>
                    <User size={16} color={COLORS.moss} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Aditi Verma"
                      placeholderTextColor={COLORS.sage}
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputRow}>
                  <Mail size={16} color={COLORS.moss} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@domain.com"
                    placeholderTextColor={COLORS.sage}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputRow}>
                  <Lock size={16} color={COLORS.moss} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.sage}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                  />
                </View>
              </View>

              <Button
                title={
                  mode === 'signin'
                    ? 'Sign In to STILL POINT'
                    : 'Register Citizen Account'
                }
                variant="primary"
                size="lg"
                loading={submitting}
                onPress={handleSubmit}
                rightIcon={<ArrowRight size={17} color={COLORS.clay} />}
                style={styles.submitBtn}
              />
            </View>
          </Card>

          {/* Footer Note */}
          <Text style={styles.footerNote}>
            Municipal ward officials must use the STILL POINT desktop web portal. Sessions are encrypted locally via Android Keystore.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.stone,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.base,
    gap: SPACING.base,
    paddingBottom: SPACING['2xl'],
  },
  heroBanner: {
    backgroundColor: COLORS.bark,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.barkLight,
    padding: SPACING.lg,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.full,
    backgroundColor: COLORS.barkLight,
    borderWidth: 1,
    borderColor: COLORS.barkBorder,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.clay,
  },
  pillText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xxs,
    color: COLORS.clay,
    letterSpacing: 1.4,
    fontWeight: FONT_WEIGHTS.bold,
  },
  heroTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.stone,
    lineHeight: 30,
  },
  heroSubtitle: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.sage,
    lineHeight: 19,
  },
  heroFeatureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: RADII.md,
    backgroundColor: COLORS.barkDark,
    borderWidth: 1,
    borderColor: COLORS.barkLight,
  },
  heroFeatureTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.stone,
    letterSpacing: 0.8,
  },
  heroFeatureDesc: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.sage,
    marginTop: 2,
    lineHeight: 16,
  },
  officialBlockCard: {
    backgroundColor: 'rgba(168, 72, 53, 0.08)',
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    padding: SPACING.base,
    gap: 12,
  },
  officialBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  officialIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADII.md,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officialEyebrow: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.danger,
    letterSpacing: 1.2,
  },
  officialTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.dangerText,
    marginTop: 2,
  },
  officialMessage: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.bark,
    lineHeight: 19,
  },
  desktopHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: RADII.md,
    backgroundColor: COLORS.bark,
  },
  desktopHintText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.stone,
    lineHeight: 16,
  },
  dismissBtn: {
    borderColor: COLORS.danger,
  },
  envNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(197, 138, 102, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(197, 138, 102, 0.35)',
  },
  envNoticeText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.clayText,
    lineHeight: 17,
  },
  formCard: {
    padding: SPACING.lg,
    gap: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.linen,
    gap: 18,
  },
  tabItem: {
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.bark,
  },
  tabText: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.sage,
  },
  tabTextActive: {
    color: COLORS.bark,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(168, 72, 53, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168, 72, 53, 0.3)',
  },
  errorText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.dangerText,
    lineHeight: 18,
  },
  errorBold: {
    fontWeight: FONT_WEIGHTS.bold,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(94, 111, 99, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94, 111, 99, 0.3)',
  },
  successText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.bark,
    lineHeight: 18,
  },
  fields: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.bark,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.linen,
    borderRadius: RADII.md,
    paddingHorizontal: 14,
    height: 46,
  },
  textInput: {
    flex: 1,
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.md,
    color: COLORS.bark,
  },
  submitBtn: {
    marginTop: 6,
  },
  footerNote: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
