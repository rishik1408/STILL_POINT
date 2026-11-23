// ============================================================
// PIAMS Utility Functions (Mirroring src/lib/utils.ts)
// ============================================================

import { IssueStatus } from '@/types';

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date string with time
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return '—';
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate time remaining for SLA (matching src/lib/utils.ts)
 */
export function getSLAStatus(slaDate: string | null): {
  label: string;
  isBreached: boolean;
  daysRemaining: number;
} {
  if (!slaDate) return { label: 'No SLA', isBreached: false, daysRemaining: 0 };

  const now = new Date();
  const sla = new Date(slaDate);
  const diffMs = sla.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)}d overdue`,
      isBreached: true,
      daysRemaining: diffDays,
    };
  }
  return {
    label: `${diffDays}d remaining`,
    isBreached: false,
    daysRemaining: diffDays,
  };
}

/**
 * Get severity label from number
 */
export function getSeverityLabel(severity: number): string {
  const labels: Record<number, string> = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Critical',
  };
  return labels[severity] || 'Unknown';
}

/**
 * Check if an issue status allows updates
 */
export function isEditable(status: IssueStatus): boolean {
  return status === 'Reported' || status === 'In Progress';
}

/**
 * Generate a human-readable issue ID
 */
export function shortId(uuid: string): string {
  return `PIAMS-${uuid.slice(0, 8).toUpperCase()}`;
}

/**
 * Convert PostGIS geometry to lat/lng
 * Handles GeoJSON format and WKT from Supabase
 */
export function geoToLatLng(geom: unknown): { lat: number; lng: number } | null {
  if (!geom) return null;

  if (typeof geom === 'object' && geom !== null) {
    const g = geom as { type?: string; coordinates?: number[] };
    if (g.type === 'Point' && Array.isArray(g.coordinates) && g.coordinates.length >= 2) {
      return { lat: Number(g.coordinates[1]), lng: Number(g.coordinates[0]) };
    }
  }

  if (typeof geom === 'string') {
    const match = geom.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
      return { lat: parseFloat(match[2]), lng: parseFloat(match[1]) };
    }
  }

  return null;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
