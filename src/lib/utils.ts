// ============================================================
// PIAMS Utility Functions
// ============================================================

import { type IssueStatus } from '@/types';

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date string with time
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate time remaining for SLA
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
    return { label: `${Math.abs(diffDays)}d overdue`, isBreached: true, daysRemaining: diffDays };
  }
  if (diffDays <= 3) {
    return { label: `${diffDays}d remaining`, isBreached: false, daysRemaining: diffDays };
  }
  return { label: `${diffDays}d remaining`, isBreached: false, daysRemaining: diffDays };
}

/**
 * Get severity label from number
 */
export function getSeverityLabel(severity: number): string {
  const labels: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
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
 * Handles GeoJSON format from Supabase
 */
export function geoToLatLng(geom: unknown): { lat: number; lng: number } | null {
  if (!geom) return null;
  
  // Handle GeoJSON Point
  if (typeof geom === 'object' && geom !== null) {
    const g = geom as { type?: string; coordinates?: number[] };
    if (g.type === 'Point' && Array.isArray(g.coordinates)) {
      return { lat: g.coordinates[1], lng: g.coordinates[0] };
    }
  }
  
  // Handle string WKT-like format
  if (typeof geom === 'string') {
    const match = geom.match(/POINT\(([^ ]+) ([^ ]+)\)/);
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

/**
 * cn utility for conditional classNames
 */
export function cn(...classes: (string | boolean | undefined | null | number | unknown)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Fast client-side image compression to base64 Data URL
 * Uses HTML5 Canvas to downscale high-resolution device photos (e.g. 12MP -> 800px)
 * Keeps payload lightweight (~50-100KB) and perfectly tailored for fast AI vision inference.
 */
export async function fileToCompressedBase64(
  file: File,
  maxDim = 800,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        resolve('');
        return;
      }

      // If in non-browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        resolve(result);
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
