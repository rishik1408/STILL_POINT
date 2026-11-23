// ============================================================
// STILL POINT Data Integration Layer
// Direct Supabase query service (Zero synthetic mock arrays)
// Returns real data or clean empty arrays/states when empty
// ============================================================

import { createClient } from '@/lib/supabase-client';
import {
  Asset,
  Authority,
  Issue,
  Media,
  StatusUpdate,
  DashboardStats,
  DefectCategory,
  IssueStatus,
  AuditVerdict,
  MediaStage,
  AIReportResult,
} from '@/types';
import { geoToLatLng } from '@/lib/utils';

// Filter interface for issue queries
export interface IssueFilter {
  status?: string;
  severity?: number | string;
  category?: string;
  authorityId?: string;
  assetId?: string;
  searchQuery?: string;
}

// Input interface for creating an issue
export interface CreateIssueInput {
  asset_id?: string | null;
  reported_by?: string | null;
  authority_id?: string | null;
  category: DefectCategory;
  severity: number;
  status?: IssueStatus;
  ai_raw_json?: AIReportResult | null;
  human_final_json?: AIReportResult | null;
  lat?: number;
  lng?: number;
  sla_due_at?: string | null;
  media_url?: string | null;
  media_stage?: MediaStage;
  initial_notes?: string | null;
}

/**
 * Robust extraction of lat/lng from any PostGIS Point representation
 */
export function extractCoordinates(geom: unknown): { lat: number; lng: number } | null {
  if (!geom) return null;
  const fromUtil = geoToLatLng(geom);
  if (fromUtil) return fromUtil;

  if (typeof geom === 'string') {
    const match = geom.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
      return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
    }
  }

  if (typeof geom === 'object' && geom !== null) {
    const g = geom as { coordinates?: number[]; x?: number; y?: number };
    if (Array.isArray(g.coordinates) && g.coordinates.length >= 2) {
      return { lng: Number(g.coordinates[0]), lat: Number(g.coordinates[1]) };
    }
    if (typeof g.y === 'number' && typeof g.x === 'number') {
      return { lat: g.y, lng: g.x };
    }
  }

  return null;
}

/**
 * Point-in-polygon ray casting check for GeoJSON Polygon
 */
export function isPointInPolygon(lng: number, lat: number, polygonGeom: unknown): boolean {
  if (!polygonGeom) return false;
  let ring: number[][] | null = null;

  if (typeof polygonGeom === 'object' && polygonGeom !== null) {
    const geo = polygonGeom as { type?: string; coordinates?: number[][][] };
    if (Array.isArray(geo.coordinates) && Array.isArray(geo.coordinates[0])) {
      ring = geo.coordinates[0];
    }
  }

  if (!ring || ring.length < 3) return false;

  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Normalizes an Asset database row into the strongly typed Asset interface
 */
function normalizeAsset(row: Record<string, unknown>): Asset {
  const coords = extractCoordinates(row.geom);
  const authority = (row.authorities || row.authority || undefined) as Authority | undefined;

  return {
    id: String(row.id),
    name: String(row.name || ''),
    asset_type: row.asset_type as Asset['asset_type'],
    geom: row.geom,
    authority_id: (row.authority_id as string) || null,
    condition_score: Number(row.condition_score ?? 100),
    status: String(row.status || 'Active'),
    created_at: String(row.created_at || new Date().toISOString()),
    authority,
    lat: coords?.lat,
    lng: coords?.lng,
  };
}

/**
 * Normalizes an Issue database row into the strongly typed Issue interface
 */
function normalizeIssue(row: Record<string, unknown>): Issue {
  const rawAsset = (row.assets || row.asset || null) as Record<string, unknown> | null;
  const asset = rawAsset ? normalizeAsset(rawAsset) : undefined;
  const authority = (row.authorities || row.authority || undefined) as Authority | undefined;

  const rawMedia = (row.media || []) as Record<string, unknown>[];
  const media: Media[] = Array.isArray(rawMedia)
    ? rawMedia.map((m) => ({
        id: String(m.id),
        issue_id: String(m.issue_id || row.id),
        file_url: String(m.file_url || ''),
        stage: (m.stage as MediaStage) || 'before',
        captured_at: String(m.captured_at || m.created_at || new Date().toISOString()),
        exif_geom: m.exif_geom,
        created_at: String(m.created_at || new Date().toISOString()),
      }))
    : [];

  const rawUpdates = (row.status_updates || []) as Record<string, unknown>[];
  const status_updates: StatusUpdate[] = Array.isArray(rawUpdates)
    ? rawUpdates
        .map((u) => ({
          id: String(u.id),
          issue_id: String(u.issue_id || row.id),
          prev_status: (u.prev_status as IssueStatus) || null,
          new_status: (u.new_status as IssueStatus) || 'Reported',
          audit_verdict: (u.audit_verdict as AuditVerdict) || null,
          audit_confidence: typeof u.audit_confidence === 'number' ? u.audit_confidence : null,
          notes: (u.notes as string) || null,
          updated_by: (u.updated_by as string) || null,
          created_at: String(u.created_at || new Date().toISOString()),
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  const coords = extractCoordinates(row.geom) || (asset ? { lat: asset.lat!, lng: asset.lng! } : null);

  return {
    id: String(row.id),
    asset_id: (row.asset_id as string) || null,
    reported_by: (row.reported_by as string) || null,
    authority_id: (row.authority_id as string) || null,
    category: (row.category as DefectCategory) || 'Pothole',
    severity: Number(row.severity || 1),
    status: (row.status as IssueStatus) || 'Reported',
    ai_raw_json: (row.ai_raw_json as AIReportResult) || null,
    human_final_json: (row.human_final_json as AIReportResult) || null,
    sla_due_at: (row.sla_due_at as string) || null,
    escalation_count: Number(row.escalation_count || 0),
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
    asset,
    authority,
    media,
    status_updates,
    ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
  };
}

// ============================================================
// Core Async Query Functions
// ============================================================

/**
 * 1. fetchAssets: queries assets table joined with authorities.
 * If empty or table not initialized, returns []. No synthetic data.
 */
export async function fetchAssets(): Promise<Asset[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('assets')
      .select('*, authorities(*)')
      .order('name', { ascending: true });

    if (error) {
      console.warn('[data-service] fetchAssets warning:', error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((row) => normalizeAsset(row as Record<string, unknown>));
  } catch (err) {
    console.error('[data-service] fetchAssets error:', err);
    return [];
  }
}

/**
 * 2. fetchIssues: queries issues table joined with assets, authorities, media, status_updates.
 * Supports filtering by status, severity, category, authority, asset, and search query.
 * If empty, returns [].
 */
export async function fetchIssues(filter?: IssueFilter): Promise<Issue[]> {
  try {
    const supabase = createClient();
    let query = supabase
      .from('issues')
      .select('*, assets(*, authorities(*)), authorities(*), media(*), status_updates(*)')
      .order('created_at', { ascending: false });

    if (filter) {
      if (filter.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }
      if (filter.severity && filter.severity !== 'all') {
        query = query.eq('severity', Number(filter.severity));
      }
      if (filter.category && filter.category !== 'all') {
        query = query.eq('category', filter.category);
      }
      if (filter.authorityId && filter.authorityId !== 'all') {
        query = query.eq('authority_id', filter.authorityId);
      }
      if (filter.assetId && filter.assetId !== 'all') {
        query = query.eq('asset_id', filter.assetId);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[data-service] fetchIssues warning:', error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    let issues = data.map((row) => normalizeIssue(row as Record<string, unknown>));

    if (filter?.searchQuery?.trim()) {
      const q = filter.searchQuery.toLowerCase().trim();
      issues = issues.filter(
        (i) =>
          i.category.toLowerCase().includes(q) ||
          i.asset?.name.toLowerCase().includes(q) ||
          i.authority?.ward_name.toLowerCase().includes(q) ||
          i.authority?.department_name.toLowerCase().includes(q) ||
          i.human_final_json?.technical_summary?.toLowerCase().includes(q) ||
          i.ai_raw_json?.technical_summary?.toLowerCase().includes(q)
      );
    }

    return issues;
  } catch (err) {
    console.error('[data-service] fetchIssues error:', err);
    return [];
  }
}

/**
 * 3. createIssue: inserts real issue into issues table,
 * links media and logs initial status_update audit trail.
 */
export async function createIssue(
  data: CreateIssueInput
): Promise<{ success: boolean; issue?: Issue; error?: string }> {
  try {
    const supabase = createClient();

    // Deterministic SLA: critical defects (4) = 14 days, others = 30 days
    const slaDue =
      data.sla_due_at ||
      new Date(Date.now() + (data.severity === 4 ? 14 : 30) * 86400000).toISOString();

    const insertPayload: Record<string, unknown> = {
      asset_id: data.asset_id || null,
      reported_by: data.reported_by || null,
      authority_id: data.authority_id || null,
      category: data.category,
      severity: data.severity,
      status: data.status || 'Reported',
      ai_raw_json: data.ai_raw_json || null,
      human_final_json: data.human_final_json || null,
      sla_due_at: slaDue,
      escalation_count: 0,
    };

    if (data.lat !== undefined && data.lng !== undefined) {
      insertPayload.geom = `POINT(${data.lng} ${data.lat})`;
    }

    const { data: inserted, error: insertError } = await supabase
      .from('issues')
      .insert(insertPayload)
      .select('*, assets(*, authorities(*)), authorities(*)')
      .single();

    if (insertError) {
      console.error('[data-service] createIssue error:', insertError.message);
      return { success: false, error: insertError.message };
    }

    const newIssueId = inserted.id;

    // Insert associated media record if photo URL is provided
    if (data.media_url) {
      const mediaPayload: Record<string, unknown> = {
        issue_id: newIssueId,
        file_url: data.media_url,
        stage: data.media_stage || 'before',
        captured_at: new Date().toISOString(),
      };
      if (data.lat !== undefined && data.lng !== undefined) {
        mediaPayload.exif_geom = `POINT(${data.lng} ${data.lat})`;
      }
      await supabase.from('media').insert(mediaPayload);
    }

    // Insert initial status update audit record
    await supabase.from('status_updates').insert({
      issue_id: newIssueId,
      prev_status: null,
      new_status: data.status || 'Reported',
      notes: data.initial_notes || 'Defect reported by citizen.',
      updated_by: data.reported_by || null,
    });

    // Re-fetch complete issue with joined media and updates
    const fullIssue = await fetchIssueById(newIssueId);
    return {
      success: true,
      issue: fullIssue || normalizeIssue(inserted as Record<string, unknown>),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during issue creation';
    console.error('[data-service] createIssue exception:', message);
    return { success: false, error: message };
  }
}

/**
 * 4. fetchAuthorities: queries authorities table.
 * If empty, returns [].
 */
export async function fetchAuthorities(): Promise<Authority[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('authorities')
      .select('*')
      .order('ward_name', { ascending: true });

    if (error) {
      console.warn('[data-service] fetchAuthorities warning:', error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data as Authority[];
  } catch (err) {
    console.error('[data-service] fetchAuthorities error:', err);
    return [];
  }
}

/**
 * 5. updateIssueStatus: updates issues table and inserts into status_updates audit trail.
 */
export async function updateIssueStatus(
  id: string,
  newStatus: IssueStatus,
  notes?: string | null,
  verdict?: AuditVerdict | null,
  confidence?: number | null,
  updatedBy?: string | null
): Promise<{ success: boolean; issue?: Issue; error?: string }> {
  try {
    const supabase = createClient();

    // 1. Fetch current status
    const { data: currentIssue, error: fetchErr } = await supabase
      .from('issues')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchErr) {
      console.warn('[data-service] updateIssueStatus fetch current error:', fetchErr.message);
    }

    const prevStatus = (currentIssue?.status as IssueStatus) || null;

    // 2. Update issue status
    const { error: updateErr } = await supabase
      .from('issues')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateErr) {
      console.error('[data-service] updateIssueStatus update error:', updateErr.message);
      return { success: false, error: updateErr.message };
    }

    // 3. Insert audit log into status_updates
    const { error: logErr } = await supabase.from('status_updates').insert({
      issue_id: id,
      prev_status: prevStatus,
      new_status: newStatus,
      audit_verdict: verdict || null,
      audit_confidence: typeof confidence === 'number' ? confidence : null,
      notes: notes || null,
      updated_by: updatedBy || null,
    });

    if (logErr) {
      console.warn('[data-service] status_updates insert warning:', logErr.message);
    }

    // 4. Return updated issue
    const updated = await fetchIssueById(id);
    return { success: true, issue: updated || undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error updating status';
    console.error('[data-service] updateIssueStatus exception:', message);
    return { success: false, error: message };
  }
}

// ============================================================
// Extended Helper Functions
// ============================================================

/**
 * Fetches a single issue by ID with all joins
 */
export async function fetchIssueById(id: string): Promise<Issue | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('issues')
      .select('*, assets(*, authorities(*)), authorities(*), media(*), status_updates(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return normalizeIssue(data as Record<string, unknown>);
  } catch (err) {
    console.error('[data-service] fetchIssueById error:', err);
    return null;
  }
}

/**
 * Fetches a single asset by ID with joined authority
 */
export async function fetchAssetById(id: string): Promise<Asset | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('assets')
      .select('*, authorities(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return normalizeAsset(data as Record<string, unknown>);
  } catch (err) {
    console.error('[data-service] fetchAssetById error:', err);
    return null;
  }
}

/**
 * Computes live dashboard statistics directly from Supabase tables.
 * Returns clean zeros if empty.
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = createClient();

    // Query asset count
    const { count: assetCount, error: assetErr } = await supabase
      .from('assets')
      .select('*', { count: 'exact', head: true });

    // Query issues count and statuses
    const { data: issuesData, error: issuesErr } = await supabase
      .from('issues')
      .select('status, sla_due_at');

    if (assetErr || issuesErr) {
      console.warn('[data-service] fetchDashboardStats warning:', assetErr || issuesErr);
    }

    const issues = issuesData || [];
    const now = new Date();

    const openCount = issues.filter((i) => i.status !== 'Verified Closed').length;
    const verifiedClosedCount = issues.filter((i) => i.status === 'Verified Closed').length;
    const pendingAudits = issues.filter((i) => i.status === 'Repair Claimed').length;
    const slaBreaches = issues.filter(
      (i) => i.status !== 'Verified Closed' && i.sla_due_at && new Date(i.sla_due_at) < now
    ).length;

    return {
      total_assets: assetCount ?? 0,
      open_issues: openCount,
      verified_repairs: verifiedClosedCount,
      sla_breaches: slaBreaches,
      pending_audits: pendingAudits,
    };
  } catch (err) {
    console.error('[data-service] fetchDashboardStats error:', err);
    return {
      total_assets: 0,
      open_issues: 0,
      verified_repairs: 0,
      sla_breaches: 0,
      pending_audits: 0,
    };
  }
}

/**
 * Deterministically routes a GPS lat/lng to the responsible municipal authority.
 * Uses Supabase PostGIS RPC route_issue_to_authority with client-side ray-casting fallback.
 */
export async function routeIssueToAuthority(lat: number, lng: number): Promise<Authority | null> {
  try {
    const supabase = createClient();

    // Try PostGIS RPC function first
    const { data: rpcData, error: rpcErr } = await supabase.rpc('route_issue_to_authority', {
      lat,
      lng,
    });

    if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
      return rpcData[0] as Authority;
    }

    // Fallback: fetch authorities and check polygon intersection client-side
    const authorities = await fetchAuthorities();
    for (const auth of authorities) {
      if (auth.ward_polygon && isPointInPolygon(lng, lat, auth.ward_polygon)) {
        return auth;
      }
    }

    // Default to first registered authority if available
    return authorities.length > 0 ? authorities[0] : null;
  } catch (err) {
    console.error('[data-service] routeIssueToAuthority error:', err);
    return null;
  }
}

/**
 * Uploads an image file to Supabase Storage bucket 'infrastructure-media'
 */
export async function uploadMedia(
  file: File,
  folder = 'issues'
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    const supabase = createClient();
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('infrastructure-media')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadErr) {
      console.warn('[data-service] Storage upload warning:', uploadErr.message);
      return { success: false, error: uploadErr.message };
    }

    const { data: urlData } = supabase.storage
      .from('infrastructure-media')
      .getPublicUrl(filename);

    return { success: true, publicUrl: urlData.publicUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storage upload failed';
    console.error('[data-service] uploadMedia error:', message);
    return { success: false, error: message };
  }
}

/**
 * Fetches status update audit trail for an issue
 */
export async function fetchStatusUpdates(issueId: string): Promise<StatusUpdate[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('status_updates')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as StatusUpdate[];
  } catch (err) {
    console.error('[data-service] fetchStatusUpdates error:', err);
    return [];
  }
}
