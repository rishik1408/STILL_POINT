// ============================================================
// STILL POINT Mobile Shared UI Primitives
// Mirrors src/components/ui/shared.tsx using exact Stone & Sage tokens
// ============================================================

import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  CARD_SHADOW,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  RADII,
  SEVERITY_CONFIG,
  SPACING,
  STATUS_CONFIG,
} from '@/theme/tokens';

// ==================== Button ====================

type ButtonVariant = 'primary' | 'secondary' | 'clay' | 'outline' | 'ghost' | 'stone' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const BUTTON_VARIANTS: Record<
  ButtonVariant,
  { bg: string; text: string; border?: string }
> = {
  primary: { bg: COLORS.bark, text: COLORS.stone },
  secondary: { bg: COLORS.moss, text: COLORS.stone },
  clay: { bg: COLORS.clay, text: COLORS.white },
  outline: { bg: 'transparent', text: COLORS.bark, border: COLORS.bark },
  ghost: { bg: 'transparent', text: COLORS.moss },
  stone: { bg: 'rgba(228, 224, 214, 0.65)', text: COLORS.bark, border: COLORS.linen },
  danger: { bg: COLORS.danger, text: COLORS.white },
};

const BUTTON_SIZES: Record<ButtonSize, { pv: number; ph: number; fontSize: number }> = {
  sm: { pv: 8, ph: 12, fontSize: FONT_SIZES.sm },
  md: { pv: 11, ph: 18, fontSize: FONT_SIZES.md },
  lg: { pv: 14, ph: 22, fontSize: FONT_SIZES.base },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
}: ButtonProps) {
  const v = BUTTON_VARIANTS[variant];
  const s = BUTTON_SIZES[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.buttonBase,
        {
          backgroundColor: v.bg,
          borderColor: v.border || 'transparent',
          borderWidth: v.border ? 1 : 0,
          paddingVertical: s.pv,
          paddingHorizontal: s.ph,
          opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.buttonText, { color: v.text, fontSize: s.fontSize }]}>
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}

// ==================== Card ====================

interface CardProps {
  children: ReactNode;
  variant?: 'stone' | 'white' | 'dark';
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, variant = 'stone', style }: CardProps) {
  const variantStyle =
    variant === 'white'
      ? { backgroundColor: COLORS.white, borderColor: COLORS.linen }
      : variant === 'dark'
        ? { backgroundColor: COLORS.bark, borderColor: COLORS.barkLight }
        : { backgroundColor: COLORS.card, borderColor: COLORS.linen };

  return <View style={[styles.cardBase, variantStyle, style]}>{children}</View>;
}

// ==================== Badge ====================

type BadgeVariant = 'default' | 'stone' | 'sage' | 'moss' | 'bark' | 'clay' | 'amber' | 'red';

const BADGE_VARIANTS: Record<
  BadgeVariant,
  { bg: string; text: string; border: string }
> = {
  default: { bg: COLORS.linen, text: COLORS.bark, border: COLORS.linen },
  stone: { bg: COLORS.stone, text: COLORS.bark, border: COLORS.linen },
  sage: { bg: 'rgba(163, 173, 156, 0.25)', text: COLORS.bark, border: 'rgba(163, 173, 156, 0.35)' },
  moss: { bg: COLORS.moss, text: COLORS.stone, border: COLORS.moss },
  bark: { bg: COLORS.bark, text: COLORS.stone, border: COLORS.bark },
  clay: { bg: COLORS.clay, text: COLORS.white, border: COLORS.clay },
  amber: { bg: 'rgba(197, 138, 102, 0.2)', text: COLORS.clayText, border: 'rgba(197, 138, 102, 0.3)' },
  red: { bg: 'rgba(168, 72, 53, 0.15)', text: COLORS.dangerText, border: 'rgba(168, 72, 53, 0.25)' },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, variant = 'default', icon, style }: BadgeProps) {
  const v = BADGE_VARIANTS[variant];
  return (
    <View
      style={[
        styles.badgeBase,
        { backgroundColor: v.bg, borderColor: v.border },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.badgeText, { color: v.text }]}>{label}</Text>
    </View>
  );
}

// ==================== SeverityBadge ====================

export function SeverityBadge({ severity }: { severity: number }) {
  const cfg =
    SEVERITY_CONFIG[(severity as 1 | 2 | 3 | 4)] || SEVERITY_CONFIG[1];
  return (
    <View
      style={[
        styles.badgeBase,
        { backgroundColor: cfg.bgColor, borderColor: cfg.borderColor },
      ]}
    >
      <View style={[styles.severityDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.badgeText, { color: cfg.textColor }]}>
        {cfg.label} (S{severity})
      </Text>
    </View>
  );
}

// ==================== StatusBadge ====================

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Reported;
  return (
    <View
      style={[
        styles.badgeBase,
        { backgroundColor: cfg.bgColor, borderColor: cfg.borderColor },
      ]}
    >
      <Text style={[styles.badgeText, { color: cfg.textColor }]}>{cfg.label}</Text>
    </View>
  );
}

// ==================== StepIndicator ====================

export function StepIndicator({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.stepRow}
    >
      {steps.map((step, index) => {
        const done = index < currentStep;
        const active = index === currentStep;
        return (
          <View key={step} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                done
                  ? styles.stepCircleDone
                  : active
                    ? styles.stepCircleActive
                    : styles.stepCirclePending,
              ]}
            >
              <Text
                style={[
                  styles.stepCircleText,
                  done || active ? styles.stepCircleTextLight : styles.stepCircleTextDark,
                ]}
              >
                {done ? '✓' : String(index + 1)}
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                index <= currentStep ? styles.stepLabelActive : styles.stepLabelMuted,
              ]}
            >
              {step}
            </Text>
            {index < steps.length - 1 ? (
              <View
                style={[
                  styles.stepLine,
                  { backgroundColor: done ? COLORS.moss : COLORS.linen },
                ]}
              />
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ==================== LoadingState ====================

export function LoadingState({ message = 'Synchronizing...' }: { message?: string }) {
  return (
    <View style={styles.centerState}>
      <ActivityIndicator size="large" color={COLORS.clay} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

// ==================== EmptyState ====================

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card style={styles.emptyCard}>
      <View style={styles.emptyIconBox}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDesc}>{description}</Text>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </Card>
  );
}

// ==================== SectionHeader ====================

export function SectionHeader({
  eyebrow,
  tag,
  title,
  subtitle,
  rightAction,
}: {
  eyebrow: string;
  tag?: string;
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
}) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerTextCol}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          {tag ? (
            <>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrowTag}>{tag}</Text>
            </>
          ) : null}
        </View>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.md,
    gap: 8,
  },
  buttonText: {
    fontFamily: FONT_FAMILIES.sans,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 0.3,
  },
  cardBase: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.base,
    ...CARD_SHADOW,
  },
  badgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: RADII.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    gap: 5,
  },
  badgeText: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 6,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDone: {
    backgroundColor: COLORS.moss,
  },
  stepCircleActive: {
    backgroundColor: COLORS.bark,
    borderWidth: 2,
    borderColor: COLORS.clay,
  },
  stepCirclePending: {
    backgroundColor: COLORS.linen,
  },
  stepCircleText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  stepCircleTextLight: {
    color: COLORS.stone,
  },
  stepCircleTextDark: {
    color: COLORS.moss,
  },
  stepLabel: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  stepLabelActive: {
    color: COLORS.bark,
  },
  stepLabelMuted: {
    color: COLORS.sage,
  },
  stepLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.stone,
    borderWidth: 1,
    borderColor: COLORS.linen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
    textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.moss,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyAction: {
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eyebrow: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xxs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.moss,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.clay,
  },
  eyebrowTag: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xxs,
    color: COLORS.sage,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.moss,
    marginTop: 4,
    lineHeight: 18,
  },
});
