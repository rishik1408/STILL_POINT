// ============================================================
// STILL POINT Mobile Offline Draft Sync Processor
// Executes the complete citizen report pipeline when connectivity returns.
// ============================================================

import {
  requestAIReport,
  requestDraftEmail,
  requestSendEmail,
} from '@/lib/api-client';
import {
  createIssue,
  routeIssueToAuthority,
  uploadMediaFromUri,
} from '@/lib/data-service';
import { isApiConfigured } from '@/lib/config';
import { OfflineDraftRecord } from '@/types';

/**
 * Processes a single queued offline draft once network connectivity returns:
 *   1. Upload compressed photo to Supabase Storage ('infrastructure-media')
 *   2. Run AI structural triage via POST /api/ai/report
 *   3. Route GPS coordinates to responsible municipal ward authority
 *   4. Persist issue + media + status_update to Supabase
 *   5. Draft & dispatch formal municipal notice email
 */
export async function processOfflineDraft(draft: OfflineDraftRecord): Promise<void> {
  const lat = draft.lat ?? 18.922;
  const lng = draft.lng ?? 72.833;

  // 1. Upload compressed photo to Supabase Storage
  const uploadRes = await uploadMediaFromUri(draft.photoUri, 'issues');

  // 2. AI Triage (if API base URL is configured)
  const aiResult = isApiConfigured()
    ? await requestAIReport({
        photoUri: draft.photoUri,
        lat,
        lng,
      })
    : {
        defect_category: 'Pothole' as const,
        severity: 3,
        confidence: 0.9,
        technical_summary:
          draft.note || 'Offline citizen infrastructure report synchronized upon reconnection.',
      };

  // 3. Deterministic ward routing
  const authority = await routeIssueToAuthority(lat, lng);
  const slaDays = aiResult.severity === 4 ? 14 : 30;
  const slaDue = new Date(Date.now() + slaDays * 86400000).toISOString();

  // 4. Create issue record in Supabase
  const createRes = await createIssue({
    category: aiResult.defect_category,
    severity: aiResult.severity,
    status: 'Reported',
    lat,
    lng,
    authority_id: authority?.id || null,
    media_url: uploadRes.publicUrl || null,
    media_stage: 'before',
    sla_due_at: slaDue,
    initial_notes: draft.note || 'Reported via STILL POINT Mobile (Offline Queue Sync).',
    ai_raw_json: aiResult,
    human_final_json: {
      ...aiResult,
      user_note: draft.note || undefined,
    },
  });

  if (!createRes.success) {
    throw new Error(createRes.error || 'Failed to persist queued issue to Supabase');
  }

  // 5. Draft and dispatch formal municipal email notice
  if (isApiConfigured()) {
    const ticketId =
      createRes.issue?.id || `STILL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const draftEmail = await requestDraftEmail({
      ticket_id: ticketId,
      defect_category: aiResult.defect_category,
      severity: aiResult.severity,
      technical_summary: aiResult.technical_summary,
      user_note: draft.note,
      ward_name: authority?.ward_name || 'Ward A — Colaba & Fort',
      department_name: authority?.department_name || 'Municipal Roads & Infrastructure',
      contact_name: authority?.contact_name || 'Executive Engineer',
      lat,
      lng,
    });

    await requestSendEmail({
      to: authority?.email || 'ward.a.roads@mcgm.gov.in',
      subject: draftEmail.subject,
      bodyText: draftEmail.body,
      issue_id: ticketId,
    });
  }
}
