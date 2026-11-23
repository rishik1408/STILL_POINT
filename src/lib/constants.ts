// ============================================================
// STILL POINT Constants & Design Tokens
// ============================================================

export const APP_NAME = 'STILL POINT';
export const APP_FULL_NAME = 'STILL POINT — Civic Infrastructure & Asset Intelligence';
export const APP_DESCRIPTION = 'Architectural civic asset monitoring, photo-to-report AI triage, deterministic GIS ward routing, and verified before-and-after repair audits in stone and stillness.';

// Stone & Sage Design Tokens
export const PALETTE = {
  stone: '#F6F4EF',  // warm stone background & quiet canvas
  linen: '#E4E0D6',  // muted card surfaces & soft borders
  sage: '#A3AD9C',   // organic accents, badges, muted text
  moss: '#5E6F63',   // secondary brand tone, deep green slate
  bark: '#26302A',   // deep timber, primary typography & headers
  clay: '#C58A66',   // warm terracotta, focal points & iris dot
} as const;

export const COLORS = {
  // Core Still Point Palette
  stone: '#F6F4EF',
  linen: '#E4E0D6',
  sage: '#A3AD9C',
  moss: '#5E6F63',
  bark: '#26302A',
  clay: '#C58A66',

  // Backward compatibility aliases mapped to STILL POINT palette
  navy: '#26302A',
  civicBlue: '#5E6F63',
  emerald: '#5E6F63',
  amber: '#C58A66',
  red: '#A84835',
  slate: '#5E6F63',
} as const;

// Severity configuration (Stone & Sage aesthetic)
export const SEVERITY_CONFIG = {
  1: { label: 'Low', color: '#5E6F63', bgColor: 'bg-[#A3AD9C]/20', textColor: 'text-[#26302A]', dotColor: 'bg-[#5E6F63]' },
  2: { label: 'Medium', color: '#C58A66', bgColor: 'bg-[#C58A66]/20', textColor: 'text-[#8A4E2D]', dotColor: 'bg-[#C58A66]' },
  3: { label: 'High', color: '#B85D36', bgColor: 'bg-[#B85D36]/20', textColor: 'text-[#7C3516]', dotColor: 'bg-[#B85D36]' },
  4: { label: 'Critical', color: '#A84835', bgColor: 'bg-[#A84835]/20', textColor: 'text-[#702115]', dotColor: 'bg-[#A84835]' },
} as const;

// Status configuration (Stone & Sage aesthetic)
export const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; textColor: string }> = {
  'Reported': { label: 'Reported', color: '#5E6F63', bgColor: 'bg-[#E4E0D6]', textColor: 'text-[#26302A]' },
  'In Progress': { label: 'In Progress', color: '#C58A66', bgColor: 'bg-[#C58A66]/20', textColor: 'text-[#8A4E2D]' },
  'Repair Claimed': { label: 'Repair Claimed', color: '#5E6F63', bgColor: 'bg-[#A3AD9C]/30', textColor: 'text-[#26302A]' },
  'Escalated': { label: 'Escalated', color: '#A84835', bgColor: 'bg-[#A84835]/20', textColor: 'text-[#702115]' },
  'Verified Closed': { label: 'Verified Closed', color: '#26302A', bgColor: 'bg-[#5E6F63]/25', textColor: 'text-[#26302A]' },
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
