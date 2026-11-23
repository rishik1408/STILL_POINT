// ============================================================
// PIAMS Constants
// ============================================================

export const APP_NAME = 'PIAMS';
export const APP_FULL_NAME = 'Public Infrastructure Asset Monitoring System';
export const APP_DESCRIPTION = 'AI-powered civic infrastructure monitoring with photo-to-report analysis, deterministic GIS ward routing, and verified before-and-after repair audits.';

// Design tokens
export const COLORS = {
  navy: '#1B365D',
  civicBlue: '#1D4ED8',
  emerald: '#15803D',
  amber: '#D97706',
  red: '#DC2626',
  slate: '#64748B',
} as const;

// Severity configuration
export const SEVERITY_CONFIG = {
  1: { label: 'Low', color: '#3B82F6', bgColor: 'bg-blue-100', textColor: 'text-blue-800', dotColor: 'bg-blue-500' },
  2: { label: 'Medium', color: '#F59E0B', bgColor: 'bg-amber-100', textColor: 'text-amber-800', dotColor: 'bg-amber-500' },
  3: { label: 'High', color: '#F97316', bgColor: 'bg-orange-100', textColor: 'text-orange-800', dotColor: 'bg-orange-500' },
  4: { label: 'Critical', color: '#EF4444', bgColor: 'bg-red-100', textColor: 'text-red-800', dotColor: 'bg-red-500' },
} as const;

// Status configuration
export const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; textColor: string }> = {
  'Reported': { label: 'Reported', color: '#3B82F6', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  'In Progress': { label: 'In Progress', color: '#F59E0B', bgColor: 'bg-amber-100', textColor: 'text-amber-800' },
  'Repair Claimed': { label: 'Repair Claimed', color: '#8B5CF6', bgColor: 'bg-violet-100', textColor: 'text-violet-800' },
  'Escalated': { label: 'Escalated', color: '#EF4444', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  'Verified Closed': { label: 'Verified Closed', color: '#22C55E', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800' },
} as const;

// Asset type configuration
export const ASSET_TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  road: { label: 'Road', icon: '🛣️' },
  bus_stop: { label: 'Bus Stop', icon: '🚏' },
  footpath: { label: 'Footpath', icon: '🚶' },
  overbridge: { label: 'Overbridge', icon: '🌉' },
} as const;

// Defect categories
export const DEFECT_CATEGORIES = [
  'Pothole',
  'Broken Footpath Slab',
  'Damaged Bus Shelter',
  'Missing Railing',
  'Lighting Failure',
  'Drainage Blockage',
] as const;

// SLA configuration (in days)
export const SLA_CONFIG = {
  critical: 14, // severity 4
  high: 14,     // severity 3
  medium: 30,   // severity 2
  low: 30,      // severity 1
} as const;

// Map defaults (Mumbai center)
export const MAP_DEFAULT_CENTER: [number, number] = [19.0760, 72.8777];
export const MAP_DEFAULT_ZOOM = 12;
