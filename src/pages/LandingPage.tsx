import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StillPointLogo } from '@/components/ui/StillPointLogo';
import { Button, Card, Badge } from '@/components/ui/shared';
import {
  Camera,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Download,
  ArrowRight,
  MapPin,
  Layers,
  ChevronRight,
  Smartphone,
  Shield,
  Eye,
} from 'lucide-react';

interface LandingPageProps {
  onOpenPwaModal: () => void;
}

export function LandingPage({ onOpenPwaModal }: LandingPageProps) {
  // 4-stage interactive workflow state
  const [activeStage, setActiveStage] = useState(0);

  const stages = [
    {
      title: '1. Photo Capture & EXIF GPS',
      tag: 'Zero Friction',
      description:
        'A citizen snaps an on-site photo. High-precision latitude, longitude, and timestamp are extracted directly from device camera GPS telemetry.',
      detail: {
        metric: '12.9716° N, 77.5946° E',
        sub: 'Extracted from EXIF camera telemetry (Bengaluru)',
        code: `{\n  "source": "camera_gps_exif",\n  "lat": 12.9716,\n  "lng": 77.5946,\n  "asset_hint": "MG Road / Vidhana Soudha Corridor"\n}`,
      },
      image:
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: '2. AI Triage & Defect Classification',
      tag: 'Schema-Enforced',
      description:
        'Civil engineering vision models identify surface degradation, calculate severity (1-4), estimate dimension, and prescribe repair methodology.',
      detail: {
        metric: 'Severity 3 / 4 (High Traffic Risk)',
        sub: 'Assigned 14-day statutory SLA',
        code: `{\n  "defect_category": "Pothole",\n  "severity": 3,\n  "confidence": 0.94,\n  "action": "Bituminous cold-mix tack coat compaction"\n}`,
      },
      image:
        'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: '3. Deterministic PostGIS Ward Route',
      tag: 'Zero Hallucinations',
      description:
        'The GPS coordinate is verified against BBMP municipal boundary polygons. Automatically dispatched to the designated Ward Executive Engineer.',
      detail: {
        metric: 'BBMP East (Indiranagar / MG Road)',
        sub: 'Road Infrastructure Division — BBMP',
        code: `{\n  "ward_name": "BBMP East",\n  "engineer": "Er. K. Ramesh",\n  "email": "ee.east@bbmp.gov.in",\n  "routing": "ST_Contains(bbmp_polygon, point)"\n}`,
      },
      image:
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: '4. AI Repair Audit & Closure',
      tag: 'Closed-Loop Proof',
      description:
        'Upon repair completion, the site engineer uploads the "After" photo. AI Auditor runs geometric verification against the baseline before ticket closure.',
      detail: {
        metric: 'Audit Verdict: Resolved (96% Rigor)',
        sub: 'Full surface reinstatement confirmed',
        code: `{\n  "audit_verdict": "Resolved",\n  "confidence": 0.96,\n  "status": "Verified Closed",\n  "remedial_action": "None required"\n}`,
      },
      image:
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="space-y-24 lg:space-y-32 pb-24">
      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 pb-16 text-center max-w-5xl mx-auto px-6">
        {/* Emblem & Brand Hero */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="mb-6">
            <StillPointLogo
              size={140}
              className="drop-shadow-sm transition-transform hover:scale-105 duration-300"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E4E0D6] border border-[#D5CFBE] text-xs font-semibold text-[#26302A]">
            <span className="w-2 h-2 rounded-full bg-[#C58A66] animate-pulse"></span>
            <span>Civic Infrastructure Asset Monitoring System</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-[#26302A] tracking-tight leading-[1.08]">
          Report, Route & Verify Public Infrastructure Repairs.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-[#5E6F63] max-w-3xl mx-auto leading-relaxed font-normal">
          Empowering citizens to report municipal hazards in 60 seconds with camera EXIF GPS, routing tickets deterministically through PostGIS wards, and holding civic agencies accountable with paired before-and-after photo verification.
        </p>

        {/* Dual CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/user/report">
            <Button variant="clay" size="lg" className="w-full sm:w-auto gap-2 shadow-sm">
              <Camera className="w-5 h-5" />
              <span>Report Defect in 60s</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="lg"
            onClick={onOpenPwaModal}
            className="w-full sm:w-auto gap-2 border-[#26302A] text-[#26302A] hover:bg-[#E4E0D6]"
          >
            <Download className="w-5 h-5 text-[#C58A66]" />
            <span>Download Mobile App (PWA)</span>
          </Button>
        </div>

        {/* Monitored Types */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#5E6F63]">
          <span className="flex items-center gap-1.5">🛣️ Municipal Roads</span>
          <span>•</span>
          <span className="flex items-center gap-1.5">🚏 Bus Stops & Shelters</span>
          <span>•</span>
          <span className="flex items-center gap-1.5">🚶 Pedestrian Footpaths</span>
          <span>•</span>
          <span className="flex items-center gap-1.5">🌉 Pedestrian Overbridges</span>
        </div>
      </section>

      {/* Interactive 4-Stage Civic Pipeline Preview */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C58A66]">
            Interactive Demonstration
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#26302A] mt-2">
            The STILL POINT End-to-End Pipeline
          </h2>
          <p className="text-sm sm:text-base text-[#5E6F63] mt-2">
            Click through the 4 stages below to see how a smartphone photo transforms into an audited municipal repair.
          </p>
        </div>

        {/* Stage Selector Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-8">
          {stages.map((stage, idx) => (
            <button
              key={stage.title}
              onClick={() => setActiveStage(idx)}
              className={`p-4 rounded-2xl text-left border transition-all ${
                activeStage === idx
                  ? 'bg-[#EDE9E0] border-[#26302A] shadow-sm'
                  : 'bg-[#F6F4EF] border-[#E4E0D6] hover:bg-[#EDE9E0]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-[#5E6F63]">
                  0{idx + 1}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    activeStage === idx
                      ? 'bg-[#26302A] text-[#F6F4EF]'
                      : 'bg-[#E4E0D6] text-[#5E6F63]'
                  }`}
                >
                  {stage.tag}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#26302A] line-clamp-1">
                {stage.title}
              </h3>
            </button>
          ))}
        </div>

        {/* Active Stage Details Card */}
        <Card className="p-6 sm:p-10 bg-white border-[#E4E0D6] shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Visual Photo & Telemetry */}
            <div className="space-y-4">
              <div className="h-72 sm:h-80 rounded-2xl overflow-hidden border border-[#E4E0D6] bg-black/5 relative">
                <img
                  src={stages[activeStage].image}
                  alt={stages[activeStage].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-[#26302A]/90 backdrop-blur-md text-[#F6F4EF] text-xs flex items-center justify-between">
                  <span className="font-semibold truncate">
                    {stages[activeStage].detail.metric}
                  </span>
                  <span className="text-[11px] text-[#A3AD9C]">
                    {stages[activeStage].detail.sub}
                  </span>
                </div>
              </div>
            </div>

            {/* Stage Description & JSON Telemetry */}
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C58A66]">
                  Stage 0{activeStage + 1} Architecture
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#26302A]">
                  {stages[activeStage].title}
                </h3>
                <p className="text-sm sm:text-base text-[#5E6F63] leading-relaxed">
                  {stages[activeStage].description}
                </p>
              </div>

              {/* JSON Snippet */}
              <div className="rounded-xl bg-[#26302A] text-[#F6F4EF] p-4 text-xs font-mono overflow-x-auto shadow-inner">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#3D4B41] text-[#A3AD9C]">
                  <span>Telemetry Payload</span>
                  <span className="text-[10px]">JSON Schema Verified</span>
                </div>
                <pre>{stages[activeStage].detail.code}</pre>
              </div>

              {/* Action */}
              <div className="flex items-center gap-3 pt-2">
                <Link to="/user/report">
                  <Button variant="clay" size="sm" className="gap-2">
                    <span>Try This Stage</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/user/map">
                  <Button variant="outline" size="sm" className="border-[#E4E0D6]">
                    View Live Map
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Live Stats Bar */}
      <section className="bg-[#EDE9E0] border-y border-[#E4E0D6] py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-serif font-bold text-[#26302A]">
                847
              </span>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#5E6F63]">
                Infrastructure Assets Monitored
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-serif font-bold text-[#C58A66]">
                23
              </span>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#5E6F63]">
                Active Ward Issues
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-serif font-bold text-[#15803D]">
                312
              </span>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#5E6F63]">
                Verified Closed Repairs
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-serif font-bold text-[#26302A]">
                100%
              </span>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#5E6F63]">
                Deterministic GIS Routing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Pipeline: Public Citizens vs Municipal Officials */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C58A66]">
            Dual Pipeline Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#26302A] mt-2">
            Tailored Experiences for Citizens & Officials
          </h2>
          <p className="text-sm sm:text-base text-[#5E6F63] mt-2">
            Eliminating bureaucratic friction through role-specific interfaces designed for field speed and municipal oversight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Citizen Card */}
          <Card className="p-8 bg-white border-[#E4E0D6] space-y-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE9E0] text-[#26302A] flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-[#C58A66]" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#5E6F63]">
                  Field Application
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#26302A] mt-1">
                  Public Citizens Portal
                </h3>
              </div>
              <p className="text-sm text-[#5E6F63] leading-relaxed">
                Zero app store friction. Citizens report hazards in seconds with auto EXIF geolocation, receive real-time ticket SLA tracking, and inspect repair proof via the AI Auditor.
              </p>

              <ul className="space-y-2.5 text-xs text-[#26302A] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                  <span>One-tap camera capture with automatic EXIF parsing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                  <span>Interactive Leaflet map color-coded by severity</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                  <span>Offline photo-draft caching via Dexie IndexedDB</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-[#E4E0D6]">
              <Link to="/user">
                <Button variant="clay" size="md" className="w-full justify-center">
                  Enter Citizen Portal
                </Button>
              </Link>
            </div>
          </Card>

          {/* Officials Card */}
          <Card className="p-8 bg-white border-[#E4E0D6] space-y-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#26302A] text-[#F6F4EF] flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#C58A66]" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#5E6F63]">
                  Command Console
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#26302A] mt-1">
                  Municipal Officials Console
                </h3>
              </div>
              <p className="text-sm text-[#5E6F63] leading-relaxed">
                Designed for Executive Engineers and Ward Officers. Prioritizes repair tickets by urgency, calculates SLA countdowns, and verifies contractor repair submissions.
              </p>

              <ul className="space-y-2.5 text-xs text-[#26302A] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                  <span>Prioritized ward ticket queue with automated notices</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                  <span>Before-and-after photographic repair verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                  <span>Deterministic PostGIS boundary assignment</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-[#E4E0D6]">
              <Link to="/official">
                <Button variant="secondary" size="md" className="w-full justify-center">
                  Access Municipal Console
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-5xl mx-auto px-6 text-center">
        <div className="bg-[#EDE9E0] p-10 sm:p-14 rounded-3xl border border-[#E4E0D6] space-y-6">
          <StillPointLogo
            size={70}
            className="mx-auto"
          />
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#26302A]">
            Ready to Monitor Your Municipal Ward?
          </h2>
          <p className="text-sm sm:text-base text-[#5E6F63] max-w-xl mx-auto">
            Experience civic asset intelligence firsthand. Test instant demo accounts for both Citizens and Municipal Engineers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/login">
              <Button variant="clay" size="lg">
                Log In to Online Portal
              </Button>
            </Link>
            <Link to="/user/map">
              <Button variant="stone" size="lg" className="border-[#E4E0D6]">
                Explore Live Map
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
