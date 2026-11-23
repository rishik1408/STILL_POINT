// ============================================================
// STILL POINT Mobile Role Guard
// Strictly enforces Citizen-only access on the mobile app.
// Municipal Officials (/official/*) must use the Next.js Web Portal.
// ============================================================

import { Profile, UserRole } from '@/types';

export interface RoleGuardDecision {
  allowed: boolean;
  blockedReason?: 'official_desktop_only';
  title?: string;
  message?: string;
}

export const OFFICIAL_BLOCK_TITLE = 'Officials Portal is Desktop Web Only';
export const OFFICIAL_BLOCK_MESSAGE =
  'This Android application is exclusively for Public Citizens. Municipal ward officials and executive engineers must sign in through the STILL POINT desktop web portal to access the Operator Dashboard and ward dispatch tools.';

/**
 * Evaluates whether a given user role is permitted inside the Citizen Mobile App.
 * Blocks any account with role === 'official'.
 */
export function evaluateMobileRoleAccess(
  role: UserRole | string | null | undefined
): RoleGuardDecision {
  if (role === 'official') {
    return {
      allowed: false,
      blockedReason: 'official_desktop_only',
      title: OFFICIAL_BLOCK_TITLE,
      message: OFFICIAL_BLOCK_MESSAGE,
    };
  }

  return { allowed: true };
}

/**
 * Convenience helper checking a Profile record or auth user metadata.
 */
export function canProfileAccessMobileApp(
  profile: Pick<Profile, 'role'> | null | undefined,
  metadataRole?: unknown
): RoleGuardDecision {
  const effectiveRole =
    profile?.role ?? (typeof metadataRole === 'string' ? metadataRole : undefined);
  return evaluateMobileRoleAccess(effectiveRole);
}
