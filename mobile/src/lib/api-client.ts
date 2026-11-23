// ============================================================
// STILL POINT Mobile API Client
// Matches exact request payloads & response schemas from:
//   - src/app/api/ai/report/route.ts
//   - src/app/api/ai/draft-email/route.ts
//   - src/app/api/ai/audit/route.ts
//   - src/app/api/email/send/route.ts
// ============================================================

import { getApiBaseUrl } from '@/lib/config';
import { DEFECT_CATEGORIES } from '@/theme/tokens';
import {
  AIAuditRequest,
  AIAuditResult,
  AIDraftEmailRequest,
  AIDraftEmailResponse,
  AIReportResult,
  AuditVerdict,
  DefectCategory,
  SendEmailRequest,
  SendEmailResponse,
} from '@/types';

export interface MobilePhotoUploadDescriptor {
  uri: string;
  name: string;
  type: string;
}

function resolveBaseUrl(override?: string): string {
  const base = (override ?? getApiBaseUrl()).trim().replace(/\/$/, '');
  if (!base) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL is not configured. Set it in mobile/.env to your deployed STILL POINT Next.js URL.'
    );
  }
  return base;
}

function isValidDefectCategory(value: unknown): value is DefectCategory {
  return (
    typeof value === 'string' &&
    (DEFECT_CATEGORIES as readonly string[]).includes(value)
  );
}

function isValidAuditVerdict(value: unknown): value is AuditVerdict {
  return (
    value === 'Resolved' ||
    value === 'Partially Patched' ||
    value === 'Unresolved'
  );
}

/**
 * Builds the exact FormData payload expected by POST /api/ai/report:
 *   - photo: File / React Native file descriptor
 *   - lat: string
 *   - lng: string
 */
export function buildReportFormData(input: {
  photoUri: string;
  lat: number;
  lng: number;
  fileName?: string;
  mimeType?: string;
}): FormData {
  const formData = new FormData();
  const fileDescriptor: MobilePhotoUploadDescriptor = {
    uri: input.photoUri,
    name: input.fileName || `defect-${Date.now()}.jpg`,
    type: input.mimeType || 'image/jpeg',
  };

  formData.append('photo', fileDescriptor as unknown as Blob);
  formData.append('lat', String(input.lat));
  formData.append('lng', String(input.lng));
  return formData;
}

/**
 * Parses and validates the JSON response from POST /api/ai/report.
 */
export function parseAIReportResponse(raw: unknown): AIReportResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid AI report response payload');
  }

  const obj = raw as Record<string, unknown>;
  const category: DefectCategory = isValidDefectCategory(obj.defect_category)
    ? obj.defect_category
    : 'Pothole';

  const severityNum = Number(obj.severity);
  const severity =
    Number.isFinite(severityNum) && severityNum >= 1 && severityNum <= 4
      ? Math.round(severityNum)
      : 3;

  const confidenceNum = Number(obj.confidence);
  const confidence =
    Number.isFinite(confidenceNum) && confidenceNum >= 0 && confidenceNum <= 1
      ? confidenceNum
      : 0.9;

  const technical_summary =
    typeof obj.technical_summary === 'string' && obj.technical_summary.trim()
      ? obj.technical_summary.trim()
      : 'Infrastructure surface defect identified. Municipal inspection required.';

  return {
    defect_category: category,
    severity,
    confidence,
    technical_summary,
    ...(typeof obj.provider === 'string' ? { provider: obj.provider } : {}),
  };
}

/**
 * Submits photo + coordinates to POST ${EXPO_PUBLIC_API_BASE_URL}/api/ai/report
 */
export async function requestAIReport(
  input: {
    photoUri: string;
    lat: number;
    lng: number;
    fileName?: string;
    mimeType?: string;
  },
  options?: { baseUrl?: string; fetchImpl?: typeof fetch }
): Promise<AIReportResult> {
  const baseUrl = resolveBaseUrl(options?.baseUrl);
  const fetchFn = options?.fetchImpl ?? fetch;
  const formData = buildReportFormData(input);

  const response = await fetchFn(`${baseUrl}/api/ai/report`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI Report request failed (${response.status}): ${errText || response.statusText}`);
  }

  const json = await response.json();
  return parseAIReportResponse(json);
}

/**
 * Serializes the exact JSON payload expected by POST /api/ai/draft-email.
 */
export function buildDraftEmailPayload(input: AIDraftEmailRequest): AIDraftEmailRequest {
  return {
    defect_category: input.defect_category,
    severity: input.severity,
    technical_summary: input.technical_summary,
    user_note: input.user_note ?? '',
    ward_name: input.ward_name,
    department_name: input.department_name,
    contact_name: input.contact_name,
    lat: input.lat,
    lng: input.lng,
    ...(input.ticket_id ? { ticket_id: input.ticket_id } : {}),
  };
}

/**
 * Parses and validates the JSON response from POST /api/ai/draft-email.
 */
export function parseDraftEmailResponse(raw: unknown): AIDraftEmailResponse {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid AI draft-email response payload');
  }
  const obj = raw as Record<string, unknown>;
  return {
    subject:
      typeof obj.subject === 'string' && obj.subject.trim()
        ? obj.subject
        : 'Formal Infrastructure Grievance Notice',
    body:
      typeof obj.body === 'string' && obj.body.trim()
        ? obj.body
        : 'Standard municipal notice for infrastructure inspection and repair.',
    ...(typeof obj.provider === 'string' ? { provider: obj.provider } : {}),
  };
}

/**
 * Requests a formal municipal notice draft from POST ${EXPO_PUBLIC_API_BASE_URL}/api/ai/draft-email.
 */
export async function requestDraftEmail(
  input: AIDraftEmailRequest,
  options?: { baseUrl?: string; fetchImpl?: typeof fetch }
): Promise<AIDraftEmailResponse> {
  const baseUrl = resolveBaseUrl(options?.baseUrl);
  const fetchFn = options?.fetchImpl ?? fetch;
  const payload = buildDraftEmailPayload(input);

  const response = await fetchFn(`${baseUrl}/api/ai/draft-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Draft Email request failed (${response.status}): ${errText || response.statusText}`);
  }

  const json = await response.json();
  return parseDraftEmailResponse(json);
}

/**
 * Serializes the exact JSON payload expected by POST /api/email/send.
 */
export function buildSendEmailPayload(input: {
  to: string;
  subject: string;
  bodyText?: string;
  html?: string;
  issue_id?: string;
}): SendEmailRequest {
  const html =
    input.html ??
    `<pre style="font-family: monospace; white-space: pre-wrap; font-size: 13px;">${input.bodyText || ''}</pre>`;

  return {
    to: input.to,
    subject: input.subject,
    html,
    ...(input.issue_id ? { issue_id: input.issue_id } : {}),
  };
}

/**
 * Dispatches formal municipal email via POST ${EXPO_PUBLIC_API_BASE_URL}/api/email/send.
 */
export async function requestSendEmail(
  input: {
    to: string;
    subject: string;
    bodyText?: string;
    html?: string;
    issue_id?: string;
  },
  options?: { baseUrl?: string; fetchImpl?: typeof fetch }
): Promise<SendEmailResponse> {
  const baseUrl = resolveBaseUrl(options?.baseUrl);
  const fetchFn = options?.fetchImpl ?? fetch;
  const payload = buildSendEmailPayload(input);

  const response = await fetchFn(`${baseUrl}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Email Send request failed (${response.status}): ${errText || response.statusText}`);
  }

  const json = (await response.json()) as SendEmailResponse;
  return json;
}

/**
 * Serializes the exact JSON payload expected by POST /api/ai/audit.
 */
export function buildAuditPayload(input: AIAuditRequest): AIAuditRequest {
  return {
    before_url: input.before_url,
    after_url: input.after_url,
    issue_id: input.issue_id,
  };
}

/**
 * Parses and validates the JSON response from POST /api/ai/audit.
 */
export function parseAIAuditResponse(raw: unknown): AIAuditResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid AI audit response payload');
  }
  const obj = raw as Record<string, unknown>;
  const verdict: AuditVerdict = isValidAuditVerdict(obj.verdict)
    ? obj.verdict
    : 'Unresolved';

  const confidenceNum = Number(obj.confidence);
  const confidence =
    Number.isFinite(confidenceNum) && confidenceNum >= 0 && confidenceNum <= 1
      ? confidenceNum
      : 0.9;

  const reasoning =
    typeof obj.reasoning === 'string' && obj.reasoning.trim()
      ? obj.reasoning.trim()
      : 'Paired image inspection completed.';

  const requires_human_review =
    typeof obj.requires_human_review === 'boolean'
      ? obj.requires_human_review
      : confidence < 0.85 || verdict === 'Partially Patched';

  return {
    verdict,
    confidence,
    reasoning,
    requires_human_review,
    ...(typeof obj.provider === 'string' ? { provider: obj.provider } : {}),
  };
}

/**
 * Submits before/after URLs to POST ${EXPO_PUBLIC_API_BASE_URL}/api/ai/audit.
 */
export async function requestAIAudit(
  input: AIAuditRequest,
  options?: { baseUrl?: string; fetchImpl?: typeof fetch }
): Promise<AIAuditResult> {
  const baseUrl = resolveBaseUrl(options?.baseUrl);
  const fetchFn = options?.fetchImpl ?? fetch;
  const payload = buildAuditPayload(input);

  const response = await fetchFn(`${baseUrl}/api/ai/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI Audit request failed (${response.status}): ${errText || response.statusText}`);
  }

  const json = await response.json();
  return parseAIAuditResponse(json);
}
