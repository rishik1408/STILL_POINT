// ============================================================
// STILL POINT Mobile Data Integration Layer
// Direct Supabase query service mirroring src/lib/data-service.ts
// Exact table names, column names, RPCs, and storage bucket.
// ============================================================

import { File } from 'expo-file-system';
import { getSupabaseClient } from '@/lib/supabase';
import { geoToLatLng } from '@/lib/utils';
import {
  AIReportResult,
  Asset,
  AuditVerdict,
  Authority,
  DefectCategory,
  Issue,
  IssueStatus,
  Media,
  MediaStage,
  StatusUpdate,
} from '@/types';

export interface IssueFilter {
  status?: string;
  severity?: number | string;
  category?: string;
  authorityId?: string;
  assetId?: string;
  searchQuery?: string;
}

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

  const coords =
    extractCoordinates(row.geom) ||
    (asset && asset.lat !== undefined && asset.lng !== undefined
      ? { lat: asset.lat, lng: asset.lng }
      : null);

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

export async function fetchAssets(): Promise<Asset[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('assets')
      .select('*, authorities(*)')
      .order('name', { ascending: true });

    if (error || !data || !Array.isArray(data)) {
      if (error) console.warn('[mobile data-service] fetchAssets warning:', error.message);
      return [];
    }

    return data.map((row) => normalizeAsset(row as Record<string, unknown>));
  } catch (err) {
    console.error('[mobile data-service] fetchAssets error:', err);
    return [];
  }
}

export async function fetchIssues(filter?: IssueFilter): Promise<Issue[]> {
  try {
    const supabase = getSupabaseClient();
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

    if (error || !data || !Array.isArray(data)) {
      if (error) console.warn('[mobile data-service] fetchIssues warning:', error.message);
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
    console.error('[mobile data-service] fetchIssues error:', err);
    return [];
  }
}

export async function fetchIssueById(id: string): Promise<Issue | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('issues')
      .select('*, assets(*, authorities(*)), authorities(*), media(*), status_updates(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return normalizeIssue(data as Record<string, unknown>);
  } catch (err) {
    console.error('[mobile data-service] fetchIssueById error:', err);
    return null;
  }
}

export async function fetchAuthorities(): Promise<Authority[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('authorities')
      .select('*')
      .order('ward_name', { ascending: true });

    if (error || !data || !Array.isArray(data)) {
      if (error) console.warn('[mobile data-service] fetchAuthorities warning:', error.message);
      return [];
    }

    return data as Authority[];
  } catch (err) {
    console.error('[mobile data-service] fetchAuthorities error:', err);
    return [];
  }
}

/**
 * Deterministically routes GPS lat/lng to municipal ward authority via PostGIS RPC,
 * falling back to client-side polygon ray-casting then first authority (matching web).
 */
export async function routeIssueToAuthority(
  lat: number,
  lng: number
): Promise<Authority | null> {
  try {
    const supabase = getSupabaseClient();
    const { data: rpcData, error: rpcErr } = await supabase.rpc('route_issue_to_authority', {
      lat,
      lng,
    });

    if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
      const row = rpcData[0] as Record<string, unknown>;
      return {
        id: String(row.authority_id || row.id || ''),
        department_name: String(row.department_name || ''),
        ward_name: String(row.ward_name || ''),
        ward_polygon: null,
        contact_name: String(row.contact_name || ''),
        email: String(row.email || ''),
        phone: (row.phone as string) || null,
        portal_url: (row.portal_url as string) || null,
        created_at: new Date().toISOString(),
      };
    }

    const authorities = await fetchAuthorities();
    for (const auth of authorities) {
      if (auth.ward_polygon && isPointInPolygon(lng, lat, auth.ward_polygon)) {
        return auth;
      }
    }

    return authorities.length > 0 ? authorities[0] : null;
  } catch (err) {
    console.error('[mobile data-service] routeIssueToAuthority error:', err);
    return null;
  }
}

/**
 * Uploads a local JPEG image URI to Supabase Storage bucket 'infrastructure-media'.
 */
export async function uploadMediaFromUri(
  fileUri: string,
  folder = 'issues'
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const localFile = new File(fileUri);
    const buffer = await localFile.arrayBuffer();
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;

    const { error: uploadErr } = await supabase.storage
      .from('infrastructure-media')
      .upload(filename, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadErr) {
      return { success: false, error: uploadErr.message };
    }

    const { data: urlData } = supabase.storage
      .from('infrastructure-media')
      .getPublicUrl(filename);

    return { success: true, publicUrl: urlData.publicUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storage upload failed';
    return { success: false, error: message };
  }
}

/**
 * Inserts real issue into issues table, links media, and logs initial status_update.
 */
export async function createIssue(
  data: CreateIssueInput
): Promise<{ success: boolean; issue?: Issue; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const { data: authData } = await supabase.auth.getUser();
    const reportedBy = data.reported_by ?? authData.user?.id ?? null;

    const slaDue =
      data.sla_due_at ||
      new Date(Date.now() + (data.severity === 4 ? 14 : 30) * 86400000).toISOString();

    const insertPayload: Record<string, unknown> = {
      asset_id: data.asset_id || null,
      reported_by: reportedBy,
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
      return { success: false, error: insertError.message };
    }

    const newIssueId = inserted.id as string;

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

    await supabase.from('status_updates').insert({
      issue_id: newIssueId,
      prev_status: null,
      new_status: data.status || 'Reported',
      notes: data.initial_notes || 'Defect reported by citizen.',
      updated_by: reportedBy,
    });

    const fullIssue = await fetchIssueById(newIssueId);
    return {
      success: true,
      issue: fullIssue || normalizeIssue(inserted as Record<string, unknown>),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during issue creation';
    return { success: false, error: message };
  }
}

/**
 * Attaches a media row (e.g. citizen 'after' repair verification photo) to an issue.
 */
export async function addIssueMedia(
  issueId: string,
  fileUrl: string,
  stage: MediaStage,
  coords?: { lat: number; lng: number } | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = {
      issue_id: issueId,
      file_url: fileUrl,
      stage,
      captured_at: new Date().toISOString(),
    };
    if (coords) {
      payload.exif_geom = `POINT(${coords.lng} ${coords.lat})`;
    }
    const { error } = await supabase.from('media').insert(payload);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save media record',
    };
  }
}

/**
 * Updates issue status and inserts audit log into status_updates table.
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
    const supabase = getSupabaseClient();
    const { data: authData } = await supabase.auth.getUser();
    const actorId = updatedBy ?? authData.user?.id ?? null;

    const { data: currentIssue } = await supabase
      .from('issues')
      .select('status')
      .eq('id', id)
      .single();

    const prevStatus = (currentIssue?.status as IssueStatus) || null;

    const { error: updateErr } = await supabase
      .from('issues')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    await supabase.from('status_updates').insert({
      issue_id: id,
      prev_status: prevStatus,
      new_status: newStatus,
      audit_verdict: verdict || null,
      audit_confidence: typeof confidence === 'number' ? confidence : null,
      notes: notes || null,
      updated_by: actorId,
    });

    const updated = await fetchIssueById(id);
    return { success: true, issue: updated || undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error updating status';
    return { success: false, error: message };
  }
}
