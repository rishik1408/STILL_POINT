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

    const groqKey =
      process.env.GROQ_API_KEY ||
      (process.env.GEMINI_API_KEY?.startsWith('gsk_')
        ? process.env.GEMINI_API_KEY
        : null);

    // 1. If Groq Key is available, use Groq's blazing-fast gpt-oss-120b model
    if (groqKey) {
      try {
        const groqPrompt = `
You are an expert civil engineer and municipal liaison drafting a formal infrastructure grievance notice for the city administration.
Addressee: ${contact_name}, ${department_name}, ${ward_name}
Defect: ${defect_category} (Severity Level ${severity} of 4)
Technical Assessment: ${technical_summary}
Citizen Observation: ${user_note || 'None recorded'}
Coordinates: ${lat}° N, ${lng}° E
SLA Requirement: ${severity === 4 ? '14' : '30'} Days

Respond strictly in JSON with this exact schema:
{
  "subject": "[URGENT] Formal Grievance Notice...",
  "body": "Full formal municipal complaint letter text..."
}
`;

        const groqRes = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'openai/gpt-oss-120b',
              messages: [
                {
                  role: 'system',
                  content:
                    'You are the PIAMS formal municipal notice drafting engine. You must output valid, well-structured JSON only.',
                },
                { role: 'user', content: groqPrompt },
              ],
              response_format: { type: 'json_object' },
            }),
          }
        );

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const content = groqData.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            return NextResponse.json({ ...parsed, provider: 'groq' });
          }
        }
      } catch (err) {
        console.warn('Groq draft error, falling back:', err);
      }
    }

    // 2. Fallback to Gemini if standard Gemini key is present
    const geminiKey = process.env.GEMINI_API_KEY;
    if (
      geminiKey &&
      !geminiKey.startsWith('gsk_') &&
      geminiKey !== 'your-gemini-api-key'
    ) {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `
Draft a formal municipal complaint letter from the PIAMS civic platform.
Addressee: ${contact_name}, ${department_name}, ${ward_name}
Defect: ${defect_category} (Severity ${severity}/4)
Technical Assessment: ${technical_summary}
Citizen Note: ${user_note || 'None'}
Coordinates: ${lat}° N, ${lng}° E
SLA Requirement: ${severity === 4 ? '14' : '30'} Days

Respond in JSON with:
{ "subject": string, "body": string }
`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text || '{}');
      return NextResponse.json({ ...parsed, provider: 'gemini' });
    }

    // 3. Fallback Template
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
      provider: 'fallback_template',
    });
  } catch (err: unknown) {
    console.error('Draft email API error:', err);
    return NextResponse.json({
      subject: 'Formal Infrastructure Grievance Notice',
      body: 'Standard municipal notice for infrastructure inspection and repair.',
      provider: 'fallback_template',
    });
  }
}
