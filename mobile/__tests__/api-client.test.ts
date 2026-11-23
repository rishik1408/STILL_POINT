// ============================================================
// Jest Unit Tests: API Request/Response Payload Serialization
// Verifies exact alignment with src/app/api/ai/* & src/app/api/email/send
// ============================================================

import {
  buildAuditPayload,
  buildDraftEmailPayload,
  buildReportFormData,
  buildSendEmailPayload,
  parseAIAuditResponse,
  parseAIReportResponse,
  requestAIAudit,
  requestAIReport,
  requestDraftEmail,
  requestSendEmail,
} from '@/lib/api-client';

const TEST_BASE_URL = 'https://stillpoint.example.org';

describe('PIAMS Mobile API Client Contracts', () => {
  describe('POST /api/ai/report', () => {
    it('builds FormData with exact fields (photo, lat, lng) expected by report/route.ts', () => {
      const formData = buildReportFormData({
        photoUri: 'file:///cache/pothole-1600.jpg',
        lat: 18.922,
        lng: 72.833,
        fileName: 'pothole.jpg',
      });

      const entries = (formData as unknown as { _parts?: [string, unknown][] })._parts;
      if (entries) {
        const map = Object.fromEntries(entries);
        expect(map.lat).toBe('18.922');
        expect(map.lng).toBe('72.833');
        expect(map.photo).toEqual({
          uri: 'file:///cache/pothole-1600.jpg',
          name: 'pothole.jpg',
          type: 'image/jpeg',
        });
      } else {
        expect(formData.get('lat')).toBe('18.922');
        expect(formData.get('lng')).toBe('72.833');
        expect(formData.get('photo')).toBeTruthy();
      }
    });

    it('sends multipart POST to /api/ai/report and parses exact AIReportResult schema', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          defect_category: 'Broken Footpath Slab',
          severity: 3,
          confidence: 0.93,
          technical_summary:
            'Pre-cast concrete paver slab fractured with 4.5cm vertical displacement.',
          provider: 'groq',
        }),
      });

      const result = await requestAIReport(
        {
          photoUri: 'file:///cache/slab.jpg',
          lat: 19.118,
          lng: 72.862,
        },
        { baseUrl: TEST_BASE_URL, fetchImpl: mockFetch as unknown as typeof fetch }
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe(`${TEST_BASE_URL}/api/ai/report`);
      expect(init.method).toBe('POST');
      expect(init.body).toBeInstanceOf(FormData);

      expect(result).toEqual({
        defect_category: 'Broken Footpath Slab',
        severity: 3,
        confidence: 0.93,
        technical_summary:
          'Pre-cast concrete paver slab fractured with 4.5cm vertical displacement.',
        provider: 'groq',
      });
    });

    it('normalizes out-of-range severity and unknown categories defensively', () => {
      const parsed = parseAIReportResponse({
        defect_category: 'Unknown',
        severity: 99,
        confidence: 1.5,
        technical_summary: '   ',
      });

      expect(parsed.defect_category).toBe('Pothole');
      expect(parsed.severity).toBe(3);
      expect(parsed.confidence).toBe(0.9);
      expect(parsed.technical_summary.length).toBeGreaterThan(10);
    });
  });

  describe('POST /api/ai/draft-email & POST /api/email/send', () => {
    it('serializes exact JSON payload for /api/ai/draft-email and parses subject/body', async () => {
      const payload = buildDraftEmailPayload({
        ticket_id: 'STILL-9A12BC',
        defect_category: 'Drainage Blockage',
        severity: 4,
        technical_summary: 'Stormwater curb inlet 90% blocked by silt.',
        user_note: 'Floods during evening showers.',
        ward_name: 'Ward L (Kurla / Chunabhatti)',
        department_name: 'Stormwater Drains & Culverts Dept.',
        contact_name: 'Er. Anjali Kulkarni',
        lat: 19.078,
        lng: 72.875,
      });

      expect(payload).toEqual({
        ticket_id: 'STILL-9A12BC',
        defect_category: 'Drainage Blockage',
        severity: 4,
        technical_summary: 'Stormwater curb inlet 90% blocked by silt.',
        user_note: 'Floods during evening showers.',
        ward_name: 'Ward L (Kurla / Chunabhatti)',
        department_name: 'Stormwater Drains & Culverts Dept.',
        contact_name: 'Er. Anjali Kulkarni',
        lat: 19.078,
        lng: 72.875,
      });

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          subject: '[URGENT TICKET #STILL-9A12BC] Level 4 Infrastructure Defect Notice',
          body: 'Formal notice body',
          provider: 'gemini',
        }),
      });

      const response = await requestDraftEmail(payload, {
        baseUrl: TEST_BASE_URL,
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe(`${TEST_BASE_URL}/api/ai/draft-email`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual(payload);
      expect(response.subject).toContain('STILL-9A12BC');
      expect(response.body).toBe('Formal notice body');
    });

    it('serializes exact JSON payload for /api/email/send', async () => {
      const sendPayload = buildSendEmailPayload({
        to: 'ward.l.drainage@mcgm.gov.in',
        subject: 'Formal Notice',
        bodyText: 'Repair required within 14 days.',
        issue_id: 'c4000000-0000-0000-0000-000000000004',
      });

      expect(sendPayload).toEqual({
        to: 'ward.l.drainage@mcgm.gov.in',
        subject: 'Formal Notice',
        html: '<pre style="font-family: monospace; white-space: pre-wrap; font-size: 13px;">Repair required within 14 days.</pre>',
        issue_id: 'c4000000-0000-0000-0000-000000000004',
      });

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          resend_id: 're_123456',
          message: 'Email successfully sent via Resend API',
        }),
      });

      const res = await requestSendEmail(
        {
          to: sendPayload.to,
          subject: sendPayload.subject,
          html: sendPayload.html,
          issue_id: sendPayload.issue_id,
        },
        { baseUrl: TEST_BASE_URL, fetchImpl: mockFetch as unknown as typeof fetch }
      );

      expect(mockFetch.mock.calls[0][0]).toBe(`${TEST_BASE_URL}/api/email/send`);
      expect(res.success).toBe(true);
      expect(res.resend_id).toBe('re_123456');
    });
  });

  describe('POST /api/ai/audit', () => {
    it('serializes before_url, after_url, issue_id and parses audit verdicts faithfully', async () => {
      const auditReq = buildAuditPayload({
        before_url: 'https://storage.example/before.jpg',
        after_url: 'https://storage.example/after.jpg',
        issue_id: 'c3000000-0000-0000-0000-000000000003',
      });

      expect(auditReq).toEqual({
        before_url: 'https://storage.example/before.jpg',
        after_url: 'https://storage.example/after.jpg',
        issue_id: 'c3000000-0000-0000-0000-000000000003',
      });

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          verdict: 'Resolved',
          confidence: 0.96,
          reasoning: 'Surface flush and structurally sound.',
          requires_human_review: false,
          provider: 'gemini',
        }),
      });

      const result = await requestAIAudit(auditReq, {
        baseUrl: TEST_BASE_URL,
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      expect(mockFetch.mock.calls[0][0]).toBe(`${TEST_BASE_URL}/api/ai/audit`);
      expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual(auditReq);
      expect(result).toEqual({
        verdict: 'Resolved',
        confidence: 0.96,
        reasoning: 'Surface flush and structurally sound.',
        requires_human_review: false,
        provider: 'gemini',
      });
    });

    it('flags Partially Patched or sub-85% confidence for human review', () => {
      const partial = parseAIAuditResponse({
        verdict: 'Partially Patched',
        confidence: 0.91,
        reasoning: 'Loose gravel patch without binder seal.',
      });
      expect(partial.verdict).toBe('Partially Patched');
      expect(partial.requires_human_review).toBe(true);

      const lowConf = parseAIAuditResponse({
        verdict: 'Resolved',
        confidence: 0.72,
        reasoning: 'Poor lighting on after image.',
      });
      expect(lowConf.requires_human_review).toBe(true);

      const unresolved = parseAIAuditResponse({
        verdict: 'Unresolved',
        confidence: 0.95,
        reasoning: 'Pothole cavity remains unrepaired.',
      });
      expect(unresolved.verdict).toBe('Unresolved');
      expect(unresolved.requires_human_review).toBe(false);
    });
  });
});
