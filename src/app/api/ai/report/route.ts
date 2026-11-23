import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { DefectCategory } from '@/types';

// Strict schema for Gemini 2.5 Flash
const REPORT_SYSTEM_PROMPT = `
You are the PIAMS AI Infrastructure Reporter.
Analyze the provided photograph of an urban infrastructure defect.
You must classify the defect into one of the following exact categories:
- 'Pothole'
- 'Broken Footpath Slab'
- 'Damaged Bus Shelter'
- 'Missing Railing'
- 'Lighting Failure'
- 'Drainage Blockage'

Assign an engineering severity score:
1 = Low: Minor cosmetic wear, non-hazardous, aesthetic defect.
2 = Medium: Noticeable deterioration, moderate inconvenience, no immediate safety hazard.
3 = High: Significant structural damage, trip hazard, or vehicle damage risk.
4 = Critical: Dangerous hazard, exposed aggregate/rebar, deep cavity, risk of severe injury/accident.

Provide:
1. defect_category (string)
2. severity (number 1 to 4)
3. confidence (float 0.0 to 1.0)
4. technical_summary (string, concise engineering assessment 25-45 words).

Respond ONLY with valid JSON matching this schema:
{
  "defect_category": "Pothole" | "Broken Footpath Slab" | "Damaged Bus Shelter" | "Missing Railing" | "Lighting Failure" | "Drainage Blockage",
  "severity": 1 | 2 | 3 | 4,
  "confidence": number,
  "technical_summary": string
}
`;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    const lat = formData.get('lat') as string | null;
    const lng = formData.get('lng') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Graceful fallback if no GEMINI_API_KEY is configured
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      // Simulate realistic AI analysis based on filename or default
      const fileNameLower = file.name.toLowerCase();
      let detectedCategory: DefectCategory = 'Pothole';
      let detectedSeverity = 4;
      let summary = 'Deep asphalt pavement depression with broken sub-base and aggregate dislodgement. Severe hazard to two-wheeler riders.';

      if (fileNameLower.includes('footpath') || fileNameLower.includes('slab') || fileNameLower.includes('walkway')) {
        detectedCategory = 'Broken Footpath Slab';
        detectedSeverity = 3;
        summary = 'Pre-cast concrete paver slab fractured with 4.5cm vertical displacement. Significant pedestrian trip hazard.';
      } else if (fileNameLower.includes('shelter') || fileNameLower.includes('bus')) {
        detectedCategory = 'Damaged Bus Shelter';
        detectedSeverity = 3;
        summary = 'Polycarbonate roof panel detached from steel purlin with broken seating fixture. Pedestrian weather hazard.';
      } else if (fileNameLower.includes('drain') || fileNameLower.includes('water')) {
        detectedCategory = 'Drainage Blockage';
        detectedSeverity = 4;
        summary = 'Stormwater curb inlet 90% blocked by compacted silt and solid waste. Monsoon ponding hazard on carriageway.';
      } else if (fileNameLower.includes('light') || fileNameLower.includes('lamp')) {
        detectedCategory = 'Lighting Failure';
        detectedSeverity = 2;
        summary = 'Street luminaire non-functional, creating a 40m dark sector along pedestrian sidewalk.';
      } else if (fileNameLower.includes('railing') || fileNameLower.includes('barrier')) {
        detectedCategory = 'Missing Railing';
        detectedSeverity = 4;
        summary = 'Pedestrian barrier railing sheared at base; high risk of pedestrian falling into grade-separated vehicular lane.';
      }

      return NextResponse.json({
        defect_category: detectedCategory,
        severity: detectedSeverity,
        confidence: 0.94,
        technical_summary: summary,
        is_mock_fallback: true,
      });
    }

    // Call Gemini 2.5 Flash via @google/genai
    const ai = new GoogleGenAI({ apiKey });
    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString('base64');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: REPORT_SYSTEM_PROMPT },
            {
              inlineData: {
                mimeType: file.type || 'image/jpeg',
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error('AI Report API Error:', error);
    // Graceful fallback on API error
    return NextResponse.json({
      defect_category: 'Pothole',
      severity: 3,
      confidence: 0.88,
      technical_summary: 'Infrastructure surface defect identified. Surface degradation requires municipal maintenance triage.',
      is_mock_fallback: true,
    });
  }
}
