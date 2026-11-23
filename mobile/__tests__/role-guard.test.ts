// ============================================================
// Jest Unit Tests: Official Role Guard on Citizen Mobile App
// Verifies that municipal 'official' accounts are strictly
// blocked from entering the mobile dashboard and directed to web.
// ============================================================

import {
  canProfileAccessMobileApp,
  evaluateMobileRoleAccess,
  OFFICIAL_BLOCK_MESSAGE,
  OFFICIAL_BLOCK_TITLE,
} from '@/lib/role-guard';

describe('Citizen Mobile App Role Guard', () => {
  it('blocks accounts with role "official" and returns desktop web portal notice', () => {
    const decision = evaluateMobileRoleAccess('official');

    expect(decision.allowed).toBe(false);
    expect(decision.blockedReason).toBe('official_desktop_only');
    expect(decision.title).toBe(OFFICIAL_BLOCK_TITLE);
    expect(decision.message).toBe(OFFICIAL_BLOCK_MESSAGE);
    expect(decision.message?.toLowerCase()).toContain('desktop web portal');
  });

  it('allows accounts with role "user" (public citizen)', () => {
    const decision = evaluateMobileRoleAccess('user');

    expect(decision.allowed).toBe(true);
    expect(decision.blockedReason).toBeUndefined();
  });

  it('blocks official profiles and metadata fallbacks via canProfileAccessMobileApp', () => {
    const blockedProfile = canProfileAccessMobileApp({ role: 'official' }, 'user');
    expect(blockedProfile.allowed).toBe(false);
    expect(blockedProfile.blockedReason).toBe('official_desktop_only');

    const blockedViaMetadata = canProfileAccessMobileApp(null, 'official');
    expect(blockedViaMetadata.allowed).toBe(false);
    expect(blockedViaMetadata.blockedReason).toBe('official_desktop_only');

    const allowedCitizen = canProfileAccessMobileApp({ role: 'user' }, 'user');
    expect(allowedCitizen.allowed).toBe(true);

    const allowedDefault = canProfileAccessMobileApp(null, undefined);
    expect(allowedDefault.allowed).toBe(true);
  });
});
