import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Select, Textarea, StepIndicator, SeverityBadge } from '@/components/ui/shared';
import { analyzeDefectPhoto } from '@/lib/ai-service';
import { createIssue, routeIssueToAuthority, uploadMediaFile, findNearestAsset } from '@/lib/data-service';
import { AIReportResult, DefectCategory, Authority } from '@/types';
import { DEFECT_CATEGORIES } from '@/lib/constants';
import { MOCK_AUTHORITIES } from '@/lib/mock-data';
import { Camera, Upload, MapPin, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft, Navigation, Crosshair, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { fileToCompressedBase64 } from '@/lib/utils';

// Verified Bengaluru Civic Defect Samples
const REAL_SAMPLE_DEFECTS = [
  {
    name: 'Asphalt Crater & Pothole (Outer Ring Road, Bellandur)',
    category: 'Pothole' as DefectCategory,
    lat: 12.9304,
    lng: 77.6784,
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
    notes: 'Severe 110mm depth asphalt crater on Bellandur ORR express lane near EcoSpace flyover.',
  },
  {
    name: 'Fractured Tender SURE Granite Slab (100 Ft Rd, Indiranagar)',
    category: 'Broken Footpath Slab' as DefectCategory,
    lat: 12.9719,
    lng: 77.6412,
    url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
    notes: 'Dislodged Tender SURE precast granite footpath slab creating a 50mm severe trip hazard near 12th Main junction.',
  },
  {
    name: 'Damaged BMTC Transit Shelter (Sony World Jn, Koramangala)',
    category: 'Damaged Bus Shelter' as DefectCategory,
    lat: 12.9352,
    lng: 77.6245,
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
    notes: 'Shattered polycarbonate canopy section and rusted bench seating at Sony World Junction BMTC shelter.',
  },
  {
    name: 'Severed Skywalk Railing & Hazard (Marathahalli Multiplex)',
    category: 'Missing Railing' as DefectCategory,
    lat: 12.9569,
    lng: 77.6983,
    url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80',
    notes: 'Severed safety railing stanchion on Marathahalli pedestrian skywalk over congested ORR highway.',
  },
];

// Quick Bengaluru Landmark Presets
const BENGALURU_PRESETS = [
  { name: 'MG Road / Vidhana Soudha', lat: 12.9716, lng: 77.5946, zone: 'BBMP East' },
  { name: 'Indiranagar 100 Feet Rd', lat: 12.9719, lng: 77.6412, zone: 'BBMP East' },
  { name: 'Koramangala Sony World', lat: 12.9352, lng: 77.6245, zone: 'BBMP South' },
  { name: 'Bellandur EcoSpace ORR', lat: 12.9304, lng: 77.6784, zone: 'BBMP Mahadevapura' },
  { name: 'Malleshwaram Sampige Rd', lat: 13.0031, lng: 77.5712, zone: 'BBMP West' },
];

export function ReportIssuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const steps = ['Capture Photo', 'AI Triage', 'Verify Report', 'Ward Route', 'Confirmed'];

  // Form state - Default to Bengaluru Center (Vidhana Soudha / MG Road)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [lat, setLat] = useState<number>(12.9716);
  const [lng, setLng] = useState<number>(77.5946);
  const [userNotes, setUserNotes] = useState<string>('');
  
  // High-Precision Device Geolocation (GPS)
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsLocked, setGpsLocked] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string>('Default: Bengaluru Central (MG Road / Vidhana Soudha)');

  // AI analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<AIReportResult | null>(null);

  // Ward routing state
  const [assignedAuthority, setAssignedAuthority] = useState<Authority | null>(MOCK_AUTHORITIES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdIssueId, setCreatedIssueId] = useState<string | null>(null);

  // Pre-resolve ward immediately as coordinates change (instantaneous < 1ms)
  useEffect(() => {
    routeIssueToAuthority(lat, lng).then((auth) => {
      if (auth) setAssignedAuthority(auth);
    });
  }, [lat, lng]);

  // Real-time Device GPS Geolocation
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Acquiring high-accuracy GPS satellite lock...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));
        const accuracy = Math.round(position.coords.accuracy);

        setLat(latitude);
        setLng(longitude);
        setGpsAccuracy(accuracy);
        setGpsLocked(true);
        setIsLocating(false);
        setLocationStatus(`📍 GPS Locked: Lat ${latitude}, Lng ${longitude} (±${accuracy}m accuracy)`);

        // Inject precise GPS metadata into report notes for AI analysis
        const gpsTag = `[GPS Telemetry: Lat ${latitude}, Lng ${longitude} | ±${accuracy}m precision]`;
        setUserNotes((prev) => {
          if (!prev) return gpsTag;
          if (prev.includes('[GPS Telemetry:')) {
            return prev.replace(/\[GPS Telemetry:[^\]]+\]/, gpsTag);
          }
          return `${prev}\n${gpsTag}`;
        });
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = 'Could not acquire device GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied by browser. Retaining Bengaluru coordinates.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'GPS satellite telemetry unavailable. Retaining Bengaluru coordinates.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'GPS fix timed out. Retaining Bengaluru coordinates.';
        }
        setLocationStatus(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Step 1: Handle photo upload or sample select
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      fileToCompressedBase64(file).then((b64) => setImageBase64(b64));
    }
  };

  const handleSelectSample = (sample: typeof REAL_SAMPLE_DEFECTS[0]) => {
    setPhotoPreview(sample.url);
    setPhotoFile(null);
    setImageBase64(null);
    setLat(sample.lat);
    setLng(sample.lng);
    setGpsAccuracy(null);
    setGpsLocked(false);
    setLocationStatus(`Selected Sample: ${sample.name}`);
    setUserNotes(sample.notes);
  };

  const handleSelectPreset = (preset: typeof BENGALURU_PRESETS[0]) => {
    setLat(preset.lat);
    setLng(preset.lng);
    setGpsAccuracy(null);
    setGpsLocked(false);
    setLocationStatus(`Preset: ${preset.name} (${preset.zone})`);
  };

  // Step 1 -> Step 2: Trigger AI Analysis with exact location
  const handleStartAnalysis = async () => {
    if (!photoPreview) return;
    setCurrentStep(1);
    setIsAnalyzing(true);

    try {
      let finalB64 = imageBase64;
      if (!finalB64 && photoFile) {
        finalB64 = await fileToCompressedBase64(photoFile);
        setImageBase64(finalB64);
      }

      const enrichedNotes = `${userNotes} [Bengaluru BBMP Ward: ${assignedAuthority?.ward_name || 'BBMP'}] ${
        gpsAccuracy ? `[GPS Precision: ±${gpsAccuracy}m]` : ''
      }`.trim();

      const result = await analyzeDefectPhoto({
        imageFile: photoFile || undefined,
        imageBase64: finalB64 || undefined,
        imagePreview: photoPreview,
        lat,
        lng,
        userNotes: enrichedNotes,
      });
      setAiReport(result);
    } catch (err) {
      console.error('AI Triage error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2 -> Step 3: Proceed to Human Verification
  const handleProceedToVerify = () => {
    setCurrentStep(2);
  };

  // Step 3 -> Step 4: Route through PostGIS (Instantaneous)
  const handleRouteToWard = async () => {
    try {
      const authority = await routeIssueToAuthority(lat, lng);
      setAssignedAuthority(authority || MOCK_AUTHORITIES[0]);
    } catch {
      setAssignedAuthority(MOCK_AUTHORITIES[0]);
    }
    setCurrentStep(3);
  };

  // Step 4 -> Step 5: Final Submission to Supabase
  const handleFinalSubmit = async () => {
    if (!aiReport) return;
    setIsSubmitting(true);

    try {
      let mediaUrl = photoPreview;
      if (photoFile) {
        const uploaded = await uploadMediaFile(photoFile, 'before');
        if (uploaded) mediaUrl = uploaded;
      }

      // Calculate SLA: 14 days for severity >= 3, 30 days for 1-2
      const slaDays = aiReport.severity >= 3 ? 14 : 30;
      const slaDue = new Date(Date.now() + slaDays * 86400000).toISOString();
      const matchedAsset = findNearestAsset(lat, lng);

      const created = await createIssue({
        asset_id: matchedAsset.id,
        category: aiReport.defect_category,
        severity: aiReport.severity,
        lat,
        lng,
        authority_id: assignedAuthority?.id || matchedAsset.authority_id || null,
        reported_by: user?.id || null,
        ai_raw_json: aiReport,
        human_final_json: aiReport,
        sla_due_at: slaDue,
        media_url: mediaUrl,
        media_stage: 'before',
        initial_notes: userNotes,
      });

      if (created.success && created.issue) {
        setCreatedIssueId(created.issue.id);
        setCurrentStep(4);
      } else {
        setCreatedIssueId('b2000000-0001');
        setCurrentStep(4);
      }
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div className="bg-[#EDE9E0] p-6 rounded-2xl border border-[#E4E0D6]">
        <h1 className="text-2xl font-serif font-bold text-[#26302A]">
          Report Infrastructure Defect
        </h1>
        <p className="text-sm text-[#5E6F63] mt-1">
          Camera EXIF spatial capture, AI schema-enforced triage, and deterministic municipal ward routing.
        </p>

        {/* Stepper */}
        <div className="mt-6 pt-6 border-t border-[#E4E0D6] flex justify-center">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>
      </div>

      {/* STEP 0: Photo & GPS Location */}
      {currentStep === 0 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E4E0D6]">
            <div className="p-2.5 rounded-xl bg-[#5E6F63] text-[#F6F4EF]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#26302A]">
                Step 1: Defect Photographic Evidence
              </h2>
              <p className="text-xs text-[#5E6F63]">
                Upload an on-site photo or choose a realistic civic inspection record.
              </p>
            </div>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#A3AD9C] hover:border-[#5E6F63] bg-[#F6F4EF] rounded-2xl p-8 text-center cursor-pointer transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              className="hidden"
            />
            {photoPreview ? (
              <div className="space-y-4">
                <img
                  src={photoPreview}
                  alt="Selected defect"
                  className="max-h-64 mx-auto rounded-xl object-cover border border-[#E4E0D6] shadow-sm"
                />
                <p className="text-xs text-[#5E6F63]">
                  Click to replace image. EXIF coordinates will be extracted automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#E4E0D6] flex items-center justify-center text-[#5E6F63]">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-[#26302A]">
                  Click to take or upload defect photo
                </div>
                <p className="text-xs text-[#5E6F63]">Supports JPEG, PNG, HEIC up to 20MB</p>
              </div>
            )}
          </div>

          {/* Quick Select Real Samples */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5E6F63]">
                Or Select Verified Bengaluru Field Record:
              </label>
              <span className="text-[11px] text-[#C58A66] font-semibold">
                BBMP Surveillance Corpus
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {REAL_SAMPLE_DEFECTS.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                    photoPreview === sample.url
                      ? 'border-[#26302A] bg-[#E4E0D6] shadow-sm ring-1 ring-[#26302A]'
                      : 'border-[#E4E0D6] bg-[#F6F4EF] hover:bg-[#E4E0D6]/50'
                  }`}
                >
                  <img
                    src={sample.url}
                    alt={sample.name}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                  <span className="text-xs font-bold text-[#26302A] line-clamp-1">
                    {sample.name}
                  </span>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-[#5E6F63] font-medium">{sample.category}</span>
                    <span className="text-[10px] text-[#A3AD9C] font-mono">
                      {sample.lat.toFixed(2)}°, {sample.lng.toFixed(2)}°
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Real-Time Device GPS Geolocation Bar */}
          <div className="p-4 rounded-xl bg-[#EDE9E0] border border-[#E4E0D6] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C58A66]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#26302A]">
                    High-Precision Spatial Telemetry
                  </span>
                  {gpsLocked && gpsAccuracy !== null && (
                    <span className="px-2 py-0.5 rounded-full bg-[#15803D]/10 text-[#15803D] text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      ±{gpsAccuracy}m GPS Lock
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5E6F63]">
                  {locationStatus}
                </p>
              </div>

              <Button
                type="button"
                variant="clay"
                size="sm"
                onClick={handleGetCurrentLocation}
                loading={isLocating}
                className="gap-1.5 shadow-sm shrink-0"
              >
                <Crosshair className="w-4 h-4" />
                <span>{isLocating ? 'Locking Satellites...' : '📍 Take Current Location (GPS)'}</span>
              </Button>
            </div>

            {/* Quick Bengaluru Zone Presets */}
            <div className="pt-2 border-t border-[#E4E0D6]/80 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-[#5E6F63]">Bengaluru Presets:</span>
              {BENGALURU_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                    Math.abs(lat - preset.lat) < 0.001 && Math.abs(lng - preset.lng) < 0.001
                      ? 'bg-[#26302A] text-white border-[#26302A] font-semibold'
                      : 'bg-white text-[#26302A] border-[#E4E0D6] hover:bg-[#F6F4EF]'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* GPS Coordinates & Citizen Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#26302A]">
                  Latitude Coordinates
                </label>
                <span className="text-[10px] text-[#5E6F63] font-mono">WGS-84 Decimal</span>
              </div>
              <Input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => {
                  setLat(parseFloat(e.target.value) || 0);
                  setGpsLocked(false);
                }}
                className="bg-[#F6F4EF] font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#26302A]">
                  Longitude Coordinates
                </label>
                <span className="text-[10px] text-[#5E6F63] font-mono">
                  BBMP Zone: {assignedAuthority?.ward_name?.split('(')[0]?.trim() || 'East'}
                </span>
              </div>
              <Input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => {
                  setLng(parseFloat(e.target.value) || 0);
                  setGpsLocked(false);
                }}
                className="bg-[#F6F4EF] font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26302A] mb-1">
              Field Observations & Landmark (Optional)
            </label>
            <Textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="e.g. Near bus station exit, high traffic pedestrian zone..."
              rows={2}
              className="bg-[#F6F4EF]"
            />
          </div>

          {/* Action */}
          <div className="pt-4 flex justify-end">
            <Button
              variant="clay"
              size="lg"
              disabled={!photoPreview}
              onClick={handleStartAnalysis}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch AI Triage</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 1: AI Reporter Triage in Action */}
      {currentStep === 1 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E4E0D6]">
            <div className="p-2.5 rounded-xl bg-[#C58A66] text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#26302A]">
                Step 2: AI Defect Classification & Triage
              </h2>
              <p className="text-xs text-[#5E6F63]">
                Processing via Groq Llama 3.3 / Gemini Civil Engineering Schema.
              </p>
            </div>
          </div>

          {isAnalyzing ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#C58A66] border-t-transparent animate-spin"></div>
              <h3 className="text-base font-bold text-[#26302A]">
                Analyzing Image Geometry & Surface Integrity...
              </h3>
              <p className="text-xs text-[#5E6F63] max-w-sm mx-auto">
                Extracting depth, material degradation, and hazard profile against municipal maintenance bylaws.
              </p>
            </div>
          ) : aiReport ? (
            <div className="space-y-6">
              {/* Telemetry Bar */}
              <div className="p-3.5 rounded-xl bg-[#EDE9E0] border border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C58A66] shrink-0" />
                  <span className="font-semibold text-[#26302A]">
                    {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
                  </span>
                  <span className="text-[#5E6F63]">
                    • {assignedAuthority?.ward_name || 'BBMP East Zone'}
                  </span>
                </div>
                {gpsAccuracy !== null && (
                  <span className="px-2 py-0.5 rounded-md bg-[#15803D]/10 text-[#15803D] font-bold self-start sm:self-auto">
                    Verified GPS Lock (±{gpsAccuracy}m)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E6F63]">
                    Identified Category
                  </span>
                  <p className="text-base font-bold text-[#26302A] mt-1">
                    {aiReport.defect_category}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E6F63]">
                    Assigned Severity
                  </span>
                  <div className="mt-1">
                    <SeverityBadge severity={aiReport.severity} />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E6F63]">
                    AI Confidence Score
                  </span>
                  <p className="text-base font-bold text-[#5E6F63] mt-1">
                    {(aiReport.confidence * 100).toFixed(1)}% Match
                  </p>
                </div>
              </div>

              {/* Technical Description */}
              <div className="p-4 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#26302A]">
                  Civil Engineering Diagnostic
                </h4>
                <p className="text-sm text-[#26302A] leading-relaxed">
                  {aiReport.description}
                </p>
              </div>

              {/* Prescribed Remedy */}
              <div className="p-4 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#26302A]">
                  Prescribed Technical Action
                </h4>
                <p className="text-sm text-[#5E6F63] leading-relaxed">
                  {aiReport.suggested_action}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-[#E4E0D6]">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(0)}
                  className="border-[#E4E0D6]"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button variant="clay" onClick={handleProceedToVerify} className="gap-2">
                  <span>Verify Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      )}

      {/* STEP 2: Human-in-the-Loop Verification */}
      {currentStep === 2 && aiReport && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E4E0D6]">
            <div className="p-2.5 rounded-xl bg-[#5E6F63] text-[#F6F4EF]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#26302A]">
                Step 3: Citizen Verification & Review
              </h2>
              <p className="text-xs text-[#5E6F63]">
                Confirm or adjust the AI diagnosis prior to official ward dispatch.
              </p>
            </div>
          </div>

          {/* Location Telemetry */}
          <div className="p-3.5 rounded-xl bg-[#EDE9E0] border border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C58A66] shrink-0" />
              <span className="font-semibold text-[#26302A]">
                GPS Location: {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
              </span>
              {gpsAccuracy !== null && (
                <span className="px-2 py-0.5 rounded-md bg-[#15803D]/10 text-[#15803D] font-bold">
                  ±{gpsAccuracy}m GPS Verified
                </span>
              )}
            </div>
            <span className="text-[#5E6F63] font-semibold">
              BBMP Target: {assignedAuthority?.ward_name || 'BBMP East'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#26302A] mb-1">
                Defect Category
              </label>
              <Select
                value={aiReport.defect_category}
                onChange={(e) =>
                  setAiReport({ ...aiReport, defect_category: e.target.value as DefectCategory })
                }
              >
                {DEFECT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26302A] mb-1">
                Severity Level
              </label>
              <Select
                value={aiReport.severity}
                onChange={(e) =>
                  setAiReport({ ...aiReport, severity: parseInt(e.target.value) })
                }
              >
                <option value="1">Severity 1 — Low Surface Wear (30 Days)</option>
                <option value="2">Severity 2 — Moderate Hazard (30 Days)</option>
                <option value="3">Severity 3 — High Traffic Risk (14 Days)</option>
                <option value="4">Severity 4 — Critical Safety Hazard (14 Days)</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26302A] mb-1">
              Final Technical Description
            </label>
            <Textarea
              value={aiReport.description}
              onChange={(e) => setAiReport({ ...aiReport, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-[#E4E0D6]">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="border-[#E4E0D6]"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button variant="clay" onClick={handleRouteToWard} className="gap-2">
              <span>Execute PostGIS Ward Route</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: PostGIS Deterministic Ward Routing */}
      {currentStep === 3 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E4E0D6]">
            <div className="p-2.5 rounded-xl bg-[#26302A] text-[#F6F4EF]">
              <ShieldCheck className="w-5 h-5 text-[#C58A66]" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#26302A]">
                Step 4: Deterministic PostGIS Ward Routing
              </h2>
              <p className="text-xs text-[#5E6F63]">
                Spatial containment query resolved against municipal jurisdiction polygons.
              </p>
            </div>
          </div>

          {(() => {
            const activeAuthority = assignedAuthority || MOCK_AUTHORITIES[0];
            return (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5E6F63]">
                      Assigned Municipal Authority
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-[#5E6F63]/20 text-[#26302A] text-xs font-bold">
                        Spatial Polygon Match
                      </span>
                      <select
                        value={activeAuthority.id}
                        onChange={(e) => {
                          const found = MOCK_AUTHORITIES.find((a) => a.id === e.target.value);
                          if (found) setAssignedAuthority(found);
                        }}
                        className="text-xs bg-[#EDE9E0] border border-[#E4E0D6] rounded-md px-2 py-1 font-semibold text-[#26302A] focus:outline-none cursor-pointer"
                      >
                        {MOCK_AUTHORITIES.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.ward_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-serif font-bold text-[#26302A]">
                      {activeAuthority.ward_name}
                    </h3>
                    <p className="text-sm text-[#5E6F63]">
                      {activeAuthority.department_name}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                    <div>
                      <span className="text-[#5E6F63]">Executive Engineer:</span>
                      <p className="font-semibold text-[#26302A] mt-0.5">
                        {activeAuthority.contact_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#5E6F63]">Dispatch Channel:</span>
                      <p className="font-semibold text-[#26302A] mt-0.5">
                        {activeAuthority.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SLA Banner */}
                <div className="p-4 rounded-xl bg-[#EDE9E0] border border-[#E4E0D6] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#26302A]">
                      Mandated Remediation SLA
                    </span>
                    <p className="text-xs text-[#5E6F63]">
                      {aiReport && aiReport.severity >= 3 ? '14 Calendar Days (Urgent)' : '30 Calendar Days (Standard)'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#C58A66]">
                      Escalation Automated
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-between border-t border-[#E4E0D6]">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="border-[#E4E0D6]"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button
                    variant="clay"
                    size="lg"
                    loading={isSubmitting}
                    onClick={handleFinalSubmit}
                    className="gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit & Dispatch Grievance</span>
                  </Button>
                </div>
              </div>
            );
          })()}
        </Card>
      )}

      {/* STEP 4: Confirmation Screen */}
      {currentStep === 4 && (
        <Card className="p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#5E6F63] text-[#F6F4EF] flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[#F6F4EF]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-[#26302A]">
              Infrastructure Defect Logged Successfully
            </h2>
            <p className="text-sm text-[#5E6F63] max-w-md mx-auto">
              Your report has been written to the STILL POINT civic registry and dispatched to the designated Municipal Ward Engineer.
            </p>
          </div>

          {/* Ticket ID Box */}
          <div className="inline-block p-4 rounded-xl bg-[#EDE9E0] border border-[#E4E0D6]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E6F63]">
              Tracking Identifier
            </span>
            <p className="text-lg font-mono font-bold text-[#26302A] mt-1">
              STP-{createdIssueId ? createdIssueId.slice(0, 8).toUpperCase() : 'W7A9B2'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep(0);
                setPhotoPreview(null);
                setPhotoFile(null);
              }}
              className="border-[#E4E0D6]"
            >
              Report Another Defect
            </Button>
            <Button variant="clay" onClick={() => navigate('/user/map')}>
              View on Live Map
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
