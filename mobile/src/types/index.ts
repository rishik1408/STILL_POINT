// ============================================================
// PIAMS Type Definitions (Mirroring src/types/index.ts & SQL Schema)
// ============================================================

export type UserRole = 'user' | 'official';
export type AssetType = 'road' | 'bus_stop' | 'footpath' | 'overbridge';
export type IssueStatus =
  | 'Reported'
  | 'In Progress'
  | 'Repair Claimed'
  | 'Escalated'
  | 'Verified Closed';
export type MediaStage = 'before' | 'progress' | 'after';
export type DefectCategory =
  | 'Pothole'
  | 'Broken Footpath Slab'
  | 'Damaged Bus Shelter'
  | 'Missing Railing'
  | 'Lighting Failure'
  | 'Drainage Blockage';
export type AuditVerdict = 'Resolved' | 'Partially Patched' | 'Unresolved';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  authority_id: string | null;
  created_at: string;
}

export interface Authority {
  id: string;
  department_name: string;
  ward_name: string;
  ward_polygon: unknown; // GeoJSON Polygon
  contact_name: string;
  email: string;
  phone: string | null;
  portal_url: string | null;
  created_at: string;
}

export interface Asset {
  id: string;
  name: string;
  asset_type: AssetType;
  geom: unknown; // PostGIS geometry
  authority_id: string | null;
  condition_score: number;
  status: string;
  created_at: string;
  // Joined fields
  authority?: Authority;
  lat?: number;
  lng?: number;
}

export interface Issue {
  id: string;
  asset_id: string | null;
  reported_by: string | null;
  authority_id: string | null;
  category: DefectCategory;
  severity: number;
  status: IssueStatus;
  ai_raw_json: AIReportResult | null;
  human_final_json: AIReportResult | null;
  sla_due_at: string | null;
  escalation_count: number;
  created_at: string;
  updated_at: string;
  geom?: unknown;
  lat?: number;
  lng?: number;
  // Joined fields
  asset?: Asset;
  authority?: Authority;
  media?: Media[];
  status_updates?: StatusUpdate[];
  reporter?: Profile;
}

export interface Media {
  id: string;
  issue_id: string;
  file_url: string;
  stage: MediaStage;
  captured_at: string;
  exif_geom: unknown;
  created_at: string;
}

export interface StatusUpdate {
  id: string;
  issue_id: string;
  prev_status: IssueStatus | null;
  new_status: IssueStatus;
  audit_verdict: AuditVerdict | null;
  audit_confidence: number | null;
  notes: string | null;
  updated_by: string | null;
  created_at: string;
}

export interface Outbox {
  id: string;
  issue_id: string;
  to_email: string;
  subject: string;
  body: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed';
  resend_id: string | null;
  created_at: string;
}

// ==================== AI & API Schema Types ====================

export interface AIReportResult {
  defect_category: DefectCategory;
  severity: number;
  confidence: number;
  technical_summary: string;
  user_note?: string;
  provider?: string;
}

export interface AIAuditRequest {
  before_url: string;
  after_url: string;
  issue_id: string;
}

export interface AIAuditResult {
  verdict: AuditVerdict;
  confidence: number;
  reasoning: string;
  requires_human_review?: boolean;
  provider?: string;
}

export interface AIDraftEmailRequest {
  defect_category: DefectCategory;
  severity: number;
  technical_summary: string;
  user_note?: string;
  ward_name: string;
  department_name: string;
  contact_name: string;
  lat: number;
  lng: number;
  ticket_id?: string;
}

export interface AIDraftEmailResponse {
  subject: string;
  body: string;
  provider?: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  issue_id?: string;
}

export interface SendEmailResponse {
  success: boolean;
  resend_id?: string;
  queued_in_outbox?: boolean;
  message: string;
  outbox_entry?: {
    to: string;
    subject: string;
    dispatched_at: string;
    status: string;
  };
}

// ==================== Map / Geo Types ====================

export interface GeoPoint {
  lat: number;
  lng: number;
}

export type LocationSource = 'exif' | 'manual' | 'gps';

// ==================== Offline Queue Types ====================

export type OfflineSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface OfflineDraftRecord {
  id: number;
  photoUri: string;
  lat: number | null;
  lng: number | null;
  locationSource: LocationSource;
  timestamp: string;
  note: string;
  synced: boolean;
  syncStatus: OfflineSyncStatus;
  lastError: string | null;
  createdAt: string;
}
