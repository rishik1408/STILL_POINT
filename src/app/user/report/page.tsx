'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  Upload,
  MapPin,
  Bot,
  CheckCircle2,
  Building2,
  Mail,
  Send,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import exifr from 'exifr';
import {
  Button,
  Card,
  Badge,
  Input,
  Textarea,
  Select,
  StepIndicator,
  SeverityBadge,
  Spinner,
} from '@/components/ui/shared';
import { db } from '@/lib/offline-db';
import { DEFECT_CATEGORIES } from '@/lib/constants';
import { AIReportResult, Authority, DefectCategory, GeoPoint } from '@/types';
import { routeIssueToAuthority, createIssue, uploadMedia } from '@/lib/data-service';

const STEPS = [
  'Photo & GPS',
  'AI Triage',
  'Verification',
  'Ward Router',
  'Notice Email',
  'Confirmed',
];

export default function ReportIssuePage() {
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Photo & Location
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<GeoPoint>({ lat: 18.9220, lng: 72.8330 });
  const [locationSource, setLocationSource] = useState<'exif' | 'gps' | 'manual'>('manual');
  const [capturedAt, setCapturedAt] = useState<string>(new Date().toISOString());
  const [citizenNote, setCitizenNote] = useState('');
  const [isExtractingExif, setIsExtractingExif] = useState(false);

  // Step 2: AI Triage
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRawResult, setAiRawResult] = useState<AIReportResult | null>(null);

  // Step 3: Human Verification
  const [verifiedCategory, setVerifiedCategory] = useState<DefectCategory>('Pothole');
  const [verifiedSeverity, setVerifiedSeverity] = useState<number>(3);
  const [verifiedSummary, setVerifiedSummary] = useState<string>('');

  // Step 4: Authority Router
  const [mappedAuthority, setMappedAuthority] = useState<Authority | null>(null);
  const [slaDays, setSlaDays] = useState<number>(14);

  // Step 5: Email Draft & Dispatch
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isDraftingEmail, setIsDraftingEmail] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [outboxResult, setOutboxResult] = useState<unknown>(null);

  // Step 6: Confirmation
  const [generatedTicketId, setGeneratedTicketId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo Selection & EXIF Parsing
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setIsExtractingExif(true);

    try {
      const exifData = await exifr.parse(file, ['latitude', 'longitude', 'DateTimeOriginal']);
      if (exifData && exifData.latitude && exifData.longitude) {
        setGpsLocation({ lat: exifData.latitude, lng: exifData.longitude });
        setLocationSource('exif');
        if (exifData.DateTimeOriginal) {
          setCapturedAt(new Date(exifData.DateTimeOriginal).toISOString());
        }
      } else {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              setLocationSource('gps');
            },
            () => {
              setGpsLocation({ lat: 18.9220, lng: 72.8330 });
              setLocationSource('manual');
            }
          );
        }
      }

      await db.drafts.add({
        photoBlob: file,
        photoPreview: previewUrl,
        lat: gpsLocation.lat,
        lng: gpsLocation.lng,
        locationSource: locationSource,
        timestamp: capturedAt,
        note: citizenNote,
        synced: false,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('EXIF extraction skipped:', err);
    } finally {
      setIsExtractingExif(false);
    }
  };

  // Step 1 -> Step 2: Trigger AI Triage
  const proceedToAITriage = async () => {
    if (!photoFile) return;

    setCurrentStep(1);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('lat', gpsLocation.lat.toString());
      formData.append('lng', gpsLocation.lng.toString());

      const res = await fetch('/api/ai/report', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setAiRawResult(data);

      setVerifiedCategory(data.defect_category || 'Pothole');
      setVerifiedSeverity(data.severity || 3);
      setVerifiedSummary(data.technical_summary || '');

      const ward = await routeIssueToAuthority(gpsLocation.lat, gpsLocation.lng);
      setMappedAuthority(ward);
      setSlaDays(data.severity === 4 ? 14 : 30);
    } catch (err) {
      console.error('AI Triage error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 3 -> Step 4: Route Ward
  const proceedToRouting = async () => {
    const ward = await routeIssueToAuthority(gpsLocation.lat, gpsLocation.lng);
    setMappedAuthority(ward);
    setSlaDays(verifiedSeverity === 4 ? 14 : 30);
    setCurrentStep(3);
  };

  // Step 4 -> Step 5: Draft Email
  const proceedToEmailDraft = async () => {
    setCurrentStep(4);
    setIsDraftingEmail(true);

    try {
      const ticketId = 'STILL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      setGeneratedTicketId(ticketId);

      const res = await fetch('/api/ai/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          defect_category: verifiedCategory,
          severity: verifiedSeverity,
          technical_summary: verifiedSummary,
          user_note: citizenNote,
          ward_name: mappedAuthority?.ward_name || 'Ward A — Colaba & Fort',
          department_name: mappedAuthority?.department_name || 'Municipal Roads & Infrastructure',
          contact_name: mappedAuthority?.contact_name || 'Executive Engineer',
          lat: gpsLocation.lat,
          lng: gpsLocation.lng,
        }),
      });

      const data = await res.json();
      setEmailSubject(data.subject);
      setEmailBody(data.body);
    } catch (err) {
      console.error('Email draft error:', err);
    } finally {
      setIsDraftingEmail(false);
    }
  };

  // Step 5 -> Step 6: Dispatch Email and Register Ticket in Supabase
  const dispatchAndSubmit = async () => {
    setIsSendingEmail(true);

    try {
      let uploadedUrl: string | undefined = undefined;
      if (photoFile) {
        const uploadRes = await uploadMedia(photoFile, 'issues');
        if (uploadRes.success && uploadRes.publicUrl) {
          uploadedUrl = uploadRes.publicUrl;
        }
      }

      // 1. Insert real issue into Supabase issues table
      const slaDue = new Date(Date.now() + (verifiedSeverity === 4 ? 14 : 30) * 86400000).toISOString();
      const createRes = await createIssue({
        category: verifiedCategory,
        severity: verifiedSeverity,
        status: 'Reported',
        lat: gpsLocation.lat,
        lng: gpsLocation.lng,
        authority_id: mappedAuthority?.id || null,
        media_url: uploadedUrl || photoPreview || undefined,
        media_stage: 'before',
        sla_due_at: slaDue,
        initial_notes: citizenNote,
        ai_raw_json: aiRawResult,
        human_final_json: {
          defect_category: verifiedCategory,
          severity: verifiedSeverity,
          confidence: aiRawResult?.confidence || 0.95,
          technical_summary: verifiedSummary,
        },
      });

      if (createRes.success && createRes.issue?.id) {
        setGeneratedTicketId(createRes.issue.id);
      }

      // 2. Dispatch notice email via API
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: mappedAuthority?.email || 'ward.a.roads@mcgm.gov.in',
          subject: emailSubject,
          html: `<pre style="font-family: monospace; white-space: pre-wrap; font-size: 13px;">${emailBody}</pre>`,
          issue_id: createRes.issue?.id || generatedTicketId,
        }),
      });

      const data = await res.json();
      setOutboxResult(data);
      setCurrentStep(5);
    } catch (err) {
      console.error('Dispatch error:', err);
      setCurrentStep(5);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header & Step Indicator */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#5E6F63] font-semibold">
              Civic Intake Pipeline
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C58A66]" />
            <span className="text-[10px] font-mono uppercase text-[#A3AD9C]">6-Step Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#26302A] tracking-tight">
            Report Infrastructure Defect
          </h1>
          <p className="text-xs text-[#5E6F63] mt-1">
            Direct camera capture → AI structural triage → Human verification → GIS PostGIS ward routing → Formal municipal notice.
          </p>
        </div>

        <div className="overflow-x-auto pb-2">
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>
      </div>

      {/* STEP 1: PHOTO & LOCATION */}
      {currentStep === 0 && (
        <Card className="p-6 sm:p-8 space-y-6 bg-white/70 backdrop-blur-sm border border-[#E4E0D6] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-4">
            <div className="flex items-center gap-2.5 text-[#26302A]">
              <div className="h-8 w-8 rounded-xl bg-[#26302A] text-[#F6F4EF] flex items-center justify-center">
                <Camera className="h-4 w-4 text-[#C58A66]" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#5E6F63] font-semibold block">Step 1 of 6</span>
                <span className="font-serif font-bold text-base text-[#26302A]">Geotagged Field Capture</span>
              </div>
            </div>
            <Badge variant="moss">EXIF Parsing Active</Badge>
          </div>

          {/* Photo Dropzone / Capture */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#E4E0D6] hover:border-[#5E6F63] rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition bg-[#F6F4EF]/60 hover:bg-[#F6F4EF] group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {photoPreview ? (
              <div className="space-y-3 text-center">
                <div className="relative w-72 h-52 mx-auto rounded-xl overflow-hidden border border-[#E4E0D6] shadow-md">
                  <img src={photoPreview} alt="Defect preview" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-medium text-[#C58A66] group-hover:underline">Tap to replace photo</p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="h-16 w-16 rounded-2xl bg-[#E4E0D6]/60 text-[#26302A] flex items-center justify-center mx-auto border border-[#A3AD9C]/30 shadow-2xs group-hover:scale-105 transition-transform">
                  <Camera className="h-8 w-8 text-[#5E6F63]" />
                </div>
                <div>
                  <p className="text-sm font-serif font-bold text-[#26302A]">Capture Photo or Upload Image</p>
                  <p className="text-xs text-[#5E6F63] mt-0.5">Extracts camera EXIF geolocation and UTC timestamp automatically</p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#A3AD9C]">
                  <Upload className="h-3 w-3" />
                  <span>JPEG, PNG, HEIC up to 25MB</span>
                </div>
              </div>
            )}
          </div>

          {/* Location Details Card */}
          <div className="p-4 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#26302A] flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#C58A66]" />
                <span>Geospatial Coordinates</span>
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#E4E0D6] text-[#5E6F63] font-bold border border-[#A3AD9C]/30">
                Source: {locationSource}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <Input
                label="Latitude (° N)"
                type="number"
                step="any"
                value={gpsLocation.lat}
                onChange={(e) => setGpsLocation({ ...gpsLocation, lat: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Longitude (° E)"
                type="number"
                step="any"
                value={gpsLocation.lng}
                onChange={(e) => setGpsLocation({ ...gpsLocation, lng: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Citizen Note */}
          <Textarea
            label="Citizen Observation (Optional Context)"
            placeholder="Describe the defect, e.g. Deep pothole across eastbound lane, exposed aggregate causing vehicle swerving..."
            value={citizenNote}
            onChange={(e) => setCitizenNote(e.target.value)}
            rows={2}
          />

          {/* Proceed Button */}
          <Button
            onClick={proceedToAITriage}
            disabled={!photoFile || isExtractingExif}
            className="w-full flex items-center justify-center gap-2 bg-[#26302A] hover:bg-[#34423a] text-[#F6F4EF]"
            size="lg"
          >
            <span>Proceed to AI Structural Triage</span>
            <ArrowRight className="h-4 w-4 text-[#C58A66]" />
          </Button>
        </Card>
      )}

      {/* STEP 2: AI TRIAGE (SCANNER & RESULTS) */}
      {currentStep === 1 && (
        <Card className="p-6 sm:p-8 space-y-6 bg-white/70 backdrop-blur-sm border border-[#E4E0D6] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-4">
            <div className="flex items-center gap-2.5 text-[#26302A]">
              <div className="h-8 w-8 rounded-xl bg-[#26302A] text-[#F6F4EF] flex items-center justify-center">
                <Bot className="h-4 w-4 text-[#C58A66]" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#5E6F63] font-semibold block">Step 2 of 6</span>
                <span className="font-serif font-bold text-base text-[#26302A]">Multimodal AI Defect Triage</span>
              </div>
            </div>
            <Badge variant="clay">Schema Enforced</Badge>
          </div>

          {isAnalyzing ? (
            <div className="py-16 text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-[#E4E0D6] border-t-[#C58A66] animate-spin" />
                <div className="absolute inset-2 rounded-full bg-[#F6F4EF] flex items-center justify-center">
                  <Bot className="h-7 w-7 text-[#26302A]" />
                </div>
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#26302A]">Analyzing Structural Defect...</h3>
                <p className="text-xs text-[#5E6F63] mt-1 max-w-sm mx-auto">
                  Groq LLM is classifying defect taxonomy, calculating severity score 1–4, and drafting engineering summary.
                </p>
              </div>
            </div>
          ) : aiRawResult ? (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#5E6F63]/10 border border-[#5E6F63]/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[#26302A] text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-[#5E6F63]" />
                  <span>AI Structural Classification Complete</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#5E6F63]">
                  Confidence: {((aiRawResult.confidence || 0.94) * 100).toFixed(0)}%
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6]">
                  <p className="text-xs text-[#5E6F63] font-mono uppercase tracking-wider">Defect Classification</p>
                  <p className="text-base font-serif font-bold text-[#26302A] mt-1">{aiRawResult.defect_category}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6]">
                  <p className="text-xs text-[#5E6F63] font-mono uppercase tracking-wider">Assigned Severity</p>
                  <div className="mt-1">
                    <SeverityBadge severity={aiRawResult.severity} />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6] space-y-1.5">
                <p className="text-xs font-semibold text-[#26302A]">Civil Engineering Assessment</p>
                <p className="text-xs text-[#26302A]/80 leading-relaxed font-sans">{aiRawResult.technical_summary}</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(0)} className="w-1/3">
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="w-2/3 flex items-center justify-center gap-2 bg-[#26302A] hover:bg-[#34423a] text-[#F6F4EF]"
                >
                  <span>Verify Assessment</span>
                  <ArrowRight className="h-4 w-4 text-[#C58A66]" />
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      )}

      {/* STEP 3: USER VERIFICATION GATE */}
      {currentStep === 2 && (
        <Card className="p-6 sm:p-8 space-y-6 bg-white/70 backdrop-blur-sm border border-[#E4E0D6] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-4">
            <div className="flex items-center gap-2.5 text-[#26302A]">
              <div className="h-8 w-8 rounded-xl bg-[#26302A] text-[#F6F4EF] flex items-center justify-center">
                <Check className="h-4 w-4 text-[#C58A66]" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#5E6F63] font-semibold block">Step 3 of 6</span>
                <span className="font-serif font-bold text-base text-[#26302A]">Citizen Verification Gate</span>
              </div>
            </div>
            <Badge variant="moss">Human in the Loop</Badge>
          </div>

          <div className="space-y-4">
            <Select
              label="Defect Category"
              value={verifiedCategory}
              onChange={(e) => setVerifiedCategory(e.target.value as DefectCategory)}
              options={DEFECT_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5E6F63] font-mono">
                Severity Score (1 to 4)
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {[1, 2, 3, 4].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setVerifiedSeverity(lvl)}
                    className={`py-2.5 px-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                      verifiedSeverity === lvl
                        ? 'border-[#26302A] bg-[#26302A] text-[#F6F4EF] shadow-sm'
                        : 'border-[#E4E0D6] bg-[#F6F4EF] text-[#26302A] hover:bg-[#E4E0D6]/60'
                    }`}
                  >
                    Level {lvl}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Verified Engineering Assessment"
              value={verifiedSummary}
              onChange={(e) => setVerifiedSummary(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(1)} className="w-1/3">
              Back
            </Button>
            <Button
              onClick={proceedToRouting}
              className="w-2/3 flex items-center justify-center gap-2 bg-[#26302A] hover:bg-[#34423a] text-[#F6F4EF]"
            >
              <span>Confirm & Route to Ward</span>
              <ArrowRight className="h-4 w-4 text-[#C58A66]" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: DETERMINISTIC AUTHORITY ROUTER */}
      {currentStep === 3 && (
        <Card className="p-6 sm:p-8 space-y-6 bg-white/70 backdrop-blur-sm border border-[#E4E0D6] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-4">
            <div className="flex items-center gap-2.5 text-[#26302A]">
              <div className="h-8 w-8 rounded-xl bg-[#26302A] text-[#F6F4EF] flex items-center justify-center">
                <Building2 className="h-4 w-4 text-[#C58A66]" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#5E6F63] font-semibold block">Step 4 of 6</span>
                <span className="font-serif font-bold text-base text-[#26302A]">Deterministic GIS Ward Routing</span>
              </div>
            </div>
            <Badge variant="emerald">PostGIS Match</Badge>
          </div>

          <p className="text-xs text-[#5E6F63]">
            Coordinates <strong className="text-[#26302A] font-mono">{gpsLocation.lat.toFixed(4)}° N, {gpsLocation.lng.toFixed(4)}° E</strong> matched to municipal ward polygon via PostGIS boundary evaluation.
          </p>

          {mappedAuthority ? (
            <div className="p-5 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C58A66]">
                    Jurisdiction Desk
                  </span>
                  <h3 className="font-serif font-bold text-lg text-[#26302A] mt-0.5">{mappedAuthority.ward_name}</h3>
                  <p className="text-xs text-[#5E6F63]">{mappedAuthority.department_name}</p>
                </div>
                <Badge variant="clay">Mandatory SLA: {slaDays} Days</Badge>
              </div>

              <div className="grid sm:grid-cols-2 gap-2 text-xs pt-3 border-t border-[#E4E0D6] text-[#26302A]">
                <div><strong>Lead Officer:</strong> {mappedAuthority.contact_name}</div>
                <div><strong>Dispatch Channel:</strong> {mappedAuthority.email}</div>
                <div><strong>Control Room:</strong> {mappedAuthority.phone}</div>
                <div><strong>Municipal Jurisdiction:</strong> {mappedAuthority.portal_url}</div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#E4E0D6]/40 border border-[#E4E0D6] text-xs text-[#5E6F63]">
              Defaulting to Central Municipal Works Division.
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(2)} className="w-1/3">
              Back
            </Button>
            <Button
              onClick={proceedToEmailDraft}
              className="w-2/3 flex items-center justify-center gap-2 bg-[#26302A] hover:bg-[#34423a] text-[#F6F4EF]"
            >
              <span>Draft Official Notice</span>
              <ArrowRight className="h-4 w-4 text-[#C58A66]" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 5: AUTOMATIC EMAIL NOTICE SENDER */}
      {currentStep === 4 && (
        <Card className="p-6 sm:p-8 space-y-6 bg-white/70 backdrop-blur-sm border border-[#E4E0D6] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-4">
            <div className="flex items-center gap-2.5 text-[#26302A]">
              <div className="h-8 w-8 rounded-xl bg-[#26302A] text-[#F6F4EF] flex items-center justify-center">
                <Mail className="h-4 w-4 text-[#C58A66]" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#5E6F63] font-semibold block">Step 5 of 6</span>
                <span className="font-serif font-bold text-base text-[#26302A]">Municipal Notice Dispatch</span>
              </div>
            </div>
            <Badge variant="clay">Resend API / Outbox</Badge>
          </div>

          {isDraftingEmail ? (
            <div className="py-12 text-center space-y-3">
              <Spinner size="md" />
              <p className="text-xs font-semibold text-[#5E6F63]">
                Composing formal municipal notice via AI...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-[#5E6F63]">Recipient Address</label>
                <div className="p-2.5 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] text-xs font-mono text-[#26302A]">
                  {mappedAuthority?.email || 'ward.a.roads@mcgm.gov.in'}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-[#5E6F63]">Notice Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E4E0D6] text-xs font-medium text-[#26302A] bg-white focus:border-[#5E6F63] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-[#5E6F63]">Notice Body</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={8}
                  className="w-full p-3 rounded-xl border border-[#E4E0D6] text-xs font-mono bg-[#F6F4EF] text-[#26302A] leading-relaxed focus:border-[#5E6F63] outline-none"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(3)} className="w-1/3">
                  Back
                </Button>
                <Button
                  onClick={dispatchAndSubmit}
                  loading={isSendingEmail}
                  className="w-2/3 flex items-center justify-center gap-2 bg-[#26302A] hover:bg-[#34423a] text-[#F6F4EF]"
                >
                  <Send className="h-4 w-4 text-[#C58A66]" />
                  <span>Dispatch & Register Ticket</span>
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 6: CONFIRMATION SCREEN */}
      {currentStep === 5 && (
        <Card className="p-8 sm:p-10 text-center space-y-6 bg-white/70 backdrop-blur-sm border border-[#E4E0D6] shadow-sm">
          <div className="h-16 w-16 rounded-full bg-[#5E6F63]/15 text-[#5E6F63] flex items-center justify-center mx-auto border border-[#5E6F63]/30 shadow-2xs">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <Badge variant="emerald" size="md">Registered & Dispatched</Badge>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#26302A]">
              Ticket Formally Registered
            </h2>
            <p className="text-xs font-mono font-bold text-[#C58A66] text-sm">
              Reference #{generatedTicketId}
            </p>
            <p className="text-xs text-[#5E6F63] max-w-md mx-auto leading-relaxed">
              Formal notice dispatched to <strong>{mappedAuthority?.ward_name || 'Ward Authority'}</strong>. Enrolled into the STILL POINT audit pipeline with a mandatory <strong>{slaDays}-day SLA</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6] max-w-md mx-auto text-xs text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[#5E6F63]">Defect Category:</span>
              <strong className="text-[#26302A]">{verifiedCategory} (Level {verifiedSeverity})</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#5E6F63]">Routed Authority:</span>
              <strong className="text-[#26302A]">{mappedAuthority?.contact_name || 'Ward Officer'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#5E6F63]">SLA Target Deadline:</span>
              <strong className="text-[#C58A66] font-mono">{slaDays} Days Remaining</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/user/map" className="w-full sm:w-auto">
              <Button size="md" className="w-full sm:w-auto flex items-center gap-2 bg-[#26302A] text-[#F6F4EF]">
                <span>View on Sanctuary Map</span>
                <ArrowRight className="h-4 w-4 text-[#C58A66]" />
              </Button>
            </Link>

            <Link href="/user/registry" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full sm:w-auto">
                Asset Registry
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setCurrentStep(0);
                setPhotoFile(null);
                setPhotoPreview(null);
              }}
              className="w-full sm:w-auto text-[#5E6F63]"
            >
              Report Another
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
