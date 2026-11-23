import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      defect_category,
      severity,
      technical_summary,
      user_note,
      ward_name,
      department_name,
      contact_name,
      lat,
      lng,
      ticket_id,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    // Graceful fallback if no GEMINI_API_KEY
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      const subject = `[URGENT TICKET #${ticket_id || 'NEW'}] Level ${severity} Infrastructure Defect Notice: ${defect_category} at ${ward_name}`;
      const emailBody = `
To: ${contact_name}
${department_name}
Municipal Corporation of Greater Mumbai (${ward_name})

SUBJECT: STATUTORY GRIEVANCE NOTICE — PUBLIC INFRASTRUCTURE DEFECT
TICKET REFERENCE: #${ticket_id || 'PENDING'}
SEVERITY LEVEL: Level ${severity} / 4 (High Priority)
GPS COORDINATES: ${lat || '18.9220'}° N, ${lng || '72.8330'}° E

Dear Sir/Madam,

This is an automated formal notice registered through the Public Infrastructure Asset Monitoring System (PIAMS) on behalf of citizens of ${ward_name}.

1. DEFECT DESCRIPTION:
Category: ${defect_category}
Technical Engineering Summary: ${technical_summary}
${user_note ? `Citizen Observation: "${user_note}"` : ''}

2. STATUTORY SLA COMPLIANCE:
Under the Municipal Charter Service Level Agreement (SLA), this Level ${severity} hazard carries a mandatory resolution timeframe of ${severity === 4 ? '14' : '30'} calendar days from timestamp of receipt.

3. REQUIRED ACTION:
Kindly dispatch the Ward Maintenance Unit to inspect and execute corrective repairs. Upon completion, please submit post-repair photographic evidence via the PIAMS Officials Portal for automated Before-and-After AI audit sign-off.

Sincerely,
PIAMS Autonomous Civic Triage Engine
Department of Municipal Infrastructure Oversight
      `.trim();

      return NextResponse.json({
        subject,
        body: emailBody,
        is_mock_fallback: true,
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
Draft a formal, polite, and authoritative municipal complaint letter from the PIAMS civic platform to a city engineer.
Details:
- Addressee: ${contact_name}, ${department_name}, ${ward_name}
- Defect: ${defect_category} (Severity ${severity}/4)
- Technical Assessment: ${technical_summary}
- Citizen Note: ${user_note || 'None'}
- Coordinates: ${lat}° N, ${lng}° E
- SLA Requirement: ${severity === 4 ? '14' : '30'} Days

Respond in JSON with:
{
  "subject": string,
  "body": string
}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error('Draft email API error:', err);
    return NextResponse.json({
      subject: 'Formal Infrastructure Grievance Notice',
      body: 'Standard municipal notice for infrastructure inspection and repair.',
      is_mock_fallback: true,
    });
  }
}
