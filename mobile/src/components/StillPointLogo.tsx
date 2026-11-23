// ============================================================
// STILL POINT Logo Mark (Native SVG via react-native-svg)
// Exact geometry & Stone/Sage/Clay colors from
// src/components/ui/StillPointLogo.tsx
// ============================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { COLORS, FONT_FAMILIES, FONT_WEIGHTS } from '@/theme/tokens';

export interface StillPointLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'portal' | 'solid' | 'minimal';
  color?: string;
  eyeColor?: string;
  irisColor?: string;
  showWordmark?: boolean;
  subtitle?: string;
  wordmarkColor?: string;
  subtitleColor?: string;
  layout?: 'horizontal' | 'vertical';
}

const SIZE_MAP = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
};

export function StillPointLogo({
  size = 'md',
  variant = 'portal',
  color = COLORS.bark,
  eyeColor,
  irisColor = COLORS.clay,
  showWordmark = false,
  subtitle,
  wordmarkColor = COLORS.bark,
  subtitleColor = COLORS.moss,
  layout = 'horizontal',
}: StillPointLogoProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 36;
  const resolvedEyeColor = eyeColor || (variant === 'solid' ? COLORS.stone : color);

  const svg = (
    <Svg width={pixelSize} height={pixelSize} viewBox="0 0 100 100" fill="none">
      {/* Horizontal Baseline */}
      <Line
        x1="14"
        y1="82"
        x2="86"
        y2="82"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {variant === 'solid' && (
        <Path d="M 24 82 V 46 A 26 26 0 0 1 76 46 V 82 Z" fill={color} />
      )}

      {variant === 'portal' && (
        <Path
          d="M 23 82 V 46 A 27 27 0 0 1 77 46 V 82 H 68 V 46 A 18 18 0 0 0 32 46 V 82 Z"
          fill={color}
          fillRule="evenodd"
        />
      )}

      {variant === 'minimal' && (
        <Path
          d="M 26 82 V 46 A 24 24 0 0 1 74 46 V 82"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}

      {/* Internal Eye / Oval Silhouette */}
      <Path
        d="M 34 49 C 39 40 61 40 66 49 C 61 58 39 58 34 49 Z"
        stroke={resolvedEyeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={variant === 'solid' ? COLORS.stone : 'none'}
      />

      {/* Warm Clay Iris Dot — The Still Point */}
      <Circle cx="50" cy="49" r="4.2" fill={irisColor} />

      {/* Subtle Inner Reflection Point */}
      <Circle cx="51.2" cy="47.8" r="1" fill="#FFFFFF" opacity={0.8} />
    </Svg>
  );

  if (!showWordmark) {
    return svg;
  }

  return (
    <View
      style={[
        styles.wrapper,
        layout === 'vertical' ? styles.vertical : styles.horizontal,
      ]}
    >
      {svg}
      <View style={layout === 'vertical' ? styles.centeredText : undefined}>
        <Text
          style={[
            styles.wordmark,
            {
              color: wordmarkColor,
              fontSize: Math.max(13, Math.round(pixelSize * 0.42)),
            },
          ]}
        >
          STILL POINT
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              {
                color: subtitleColor,
                fontSize: Math.max(9, Math.round(pixelSize * 0.22)),
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  horizontal: {
    flexDirection: 'row',
    gap: 10,
  },
  vertical: {
    flexDirection: 'column',
    gap: 8,
  },
  centeredText: {
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: FONT_FAMILIES.serif,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.mono,
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
