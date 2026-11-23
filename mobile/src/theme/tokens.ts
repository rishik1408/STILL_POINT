// ============================================================
// STILL POINT (PIAMS) — Stone & Sage / Civic Sanctuary Tokens
// Extracted verbatim from:
//   - src/app/globals.css
//   - src/app/layout.tsx
//   - src/lib/constants.ts
//   - src/components/ui/shared.tsx
//   - src/components/map/MapView.tsx
// ============================================================

import { Platform } from 'react-native';

export const APP_NAME = 'STILL POINT';
export const APP_FULL_NAME = 'STILL POINT — Civic Infrastructure & Asset Intelligence';
export const APP_DESCRIPTION =
  'Architectural civic asset monitoring, photo-to-report AI triage, deterministic GIS ward routing, and verified before-and-after repair audits in stone and stillness.';

// Core STILL POINT Stone & Sage Palette (src/app/globals.css & src/lib/constants.ts)
export const PALETTE = {
  stone: '#F6F4EF', // --stone / --background: warm stone background & quiet canvas
  stoneCard: '#FAF9F5', // --card: muted elevated card surface
  white: '#FFFFFF',
  linen: '#E4E0D6', // --linen / --border: muted card surfaces & soft borders
  linenLight: '#EDE9DF', // --color-linen-light / --border-subtle
  sage: '#A3AD9C', // --sage: organic accents, badges, muted text
  sageLight: '#B8C0B3', // --color-sage-light
  moss: '#5E6F63', // --moss / --muted-foreground: secondary brand tone, deep green slate
  mossLight: '#728477', // --color-moss-light
  mossHover: '#4D5E52', // Button secondary hover
  bark: '#26302A', // --bark / --foreground: deep timber, primary typography & headers
  barkLight: '#34423A', // --color-bark-light
  barkDark: '#1F2722', // Login feature card surface
  barkBorder: '#415248', // Dark surface pill border
  clay: '#C58A66', // --clay / --ring: warm terracotta, focal points & iris dot
  clayHover: '#B57955', // --clay-hover
  clayText: '#8A4E2D', // Amber / S2 badge foreground text
  high: '#B85D36', // Severity 3 (High)
  highText: '#7C3516', // Severity 3 foreground text
  danger: '#A84835', // --danger / Severity 4 (Critical)
  dangerHover: '#8F3B2A',
  dangerText: '#702115', // Danger / S4 badge foreground text
} as const;

export const COLORS = {
  // Core Still Point Palette
  ...PALETTE,

  // Semantic UI Tokens (matching :root in src/app/globals.css)
  background: PALETTE.stone,
  foreground: PALETTE.bark,
  card: PALETTE.stoneCard,
  cardForeground: PALETTE.bark,
  muted: PALETTE.linen,
  mutedForeground: PALETTE.moss,
  border: PALETTE.linen,
  borderSubtle: PALETTE.linenLight,
  ring: PALETTE.clay,

  // Map-specific colors (matching src/components/map/MapView.tsx)
  mapClosed: '#15803D',
  mapConditionGood: '#15803D',
  mapConditionWarn: '#D97706',
  mapConditionBad: '#DC2626',
  wardStroke: '#1D4ED8',
  wardFill: '#3B82F6',
} as const;

// Typography Tokens (matching src/app/layout.tsx & src/app/globals.css — system font stack, no Google Fonts)
export const FONT_FAMILIES = {
  sans: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

export const FONT_SIZES = {
  xxs: 10,
  xs: 11,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Border Radii (matching --radius: 0.875rem = 14px, rounded-xl = 12px, rounded-2xl = 16px)
export const RADII = {
  sm: 8,
  md: 12,
  base: 14,
  lg: 16,
  full: 9999,
} as const;

// Spacing Scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
} as const;

// Severity configuration (Stone & Sage aesthetic — verbatim from src/lib/constants.ts)
export const SEVERITY_CONFIG = {
  1: {
    label: 'Low',
    color: '#5E6F63',
    bgColor: 'rgba(163, 173, 156, 0.25)',
    borderColor: 'rgba(163, 173, 156, 0.35)',
    textColor: '#26302A',
  },
  2: {
    label: 'Medium',
    color: '#C58A66',
    bgColor: 'rgba(197, 138, 102, 0.20)',
    borderColor: 'rgba(197, 138, 102, 0.30)',
    textColor: '#8A4E2D',
  },
  3: {
    label: 'High',
    color: '#B85D36',
    bgColor: 'rgba(197, 138, 102, 0.25)',
    borderColor: 'rgba(197, 138, 102, 0.40)',
    textColor: '#7C3516',
  },
  4: {
    label: 'Critical',
    color: '#A84835',
    bgColor: 'rgba(168, 72, 53, 0.15)',
    borderColor: 'rgba(168, 72, 53, 0.25)',
    textColor: '#702115',
  },
} as const;

// Status configuration (Stone & Sage aesthetic — verbatim from src/lib/constants.ts & shared.tsx)
export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string; textColor: string }
> = {
  Reported: {
    label: 'Reported',
    color: '#5E6F63',
    bgColor: '#F6F4EF',
    borderColor: '#E4E0D6',
    textColor: '#26302A',
  },
  'In Progress': {
    label: 'In Progress',
    color: '#C58A66',
    bgColor: 'rgba(197, 138, 102, 0.20)',
    borderColor: 'rgba(197, 138, 102, 0.30)',
    textColor: '#8A4E2D',
  },
  'Repair Claimed': {
    label: 'Repair Claimed',
    color: '#5E6F63',
    bgColor: 'rgba(163, 173, 156, 0.25)',
    borderColor: 'rgba(163, 173, 156, 0.35)',
    textColor: '#26302A',
  },
  Escalated: {
    label: 'Escalated',
    color: '#A84835',
    bgColor: 'rgba(168, 72, 53, 0.15)',
    borderColor: 'rgba(168, 72, 53, 0.25)',
    textColor: '#702115',
  },
  'Verified Closed': {
    label: 'Verified Closed',
    color: '#26302A',
    bgColor: '#5E6F63',
    borderColor: '#5E6F63',
    textColor: '#F6F4EF',
  },
};

// Asset type configuration (verbatim from src/lib/constants.ts)
export const ASSET_TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  road: { label: 'Road', icon: '🛣️' },
  bus_stop: { label: 'Bus Stop', icon: '🚏' },
  footpath: { label: 'Footpath', icon: '🚶' },
  overbridge: { label: 'Overbridge', icon: '🌉' },
};

// Defect categories (verbatim from src/lib/constants.ts & schema enum)
export const DEFECT_CATEGORIES = [
  'Pothole',
  'Broken Footpath Slab',
  'Damaged Bus Shelter',
  'Missing Railing',
  'Lighting Failure',
  'Drainage Blockage',
] as const;

// SLA configuration (in days — verbatim from src/lib/constants.ts)
export const SLA_CONFIG = {
  critical: 14, // severity 4
  high: 14, // severity 3
  medium: 30, // severity 2
  low: 30, // severity 1
} as const;

// Map defaults (Mumbai center — verbatim from src/lib/constants.ts)
export const MAP_DEFAULT_CENTER: [number, number] = [19.076, 72.8777];
export const MAP_DEFAULT_ZOOM = 12;

export const CARD_SHADOW = {
  shadowColor: '#26302A',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 1,
} as const;
