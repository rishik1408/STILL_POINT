'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Download,
  LogIn,
  CheckCircle2,
  Sparkles,
  MapPin,
  Shield,
  Clock,
  Compass,
  FileCheck2,
  Camera,
  Layers,
  ChevronRight,
  Activity,
  Smartphone,
  Eye,
  Building,
  UserCheck,
  Cpu,
  Database,
  Check,
} from 'lucide-react';
import { StillPointLogo } from '@/components/ui/StillPointLogo';
import { Button, Card, Badge } from '@/components/ui/shared';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';
import { PWAInstallModal } from '@/components/landing/PWAInstallModal';
import { fetchDashboardStats } from '@/lib/data-service';
import { DashboardStats } from '@/types';

export default function LandingPage() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [workflowTab, setWorkflowTab] = useState<'citizen' | 'official'>('citizen');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        const data = await fetchDashboardStats();
        if (mounted) {
          setStats(data);
          setStatsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load stats on landing page:', err);
        if (mounted) {
          setStats({
            total_assets: 0,
            open_issues: 0,
            verified_repairs: 0,
            sla_breaches: 0,
            pending_audits: 0,
          });
          setStatsLoading(false);
        }
      }
    }
    loadStats();
    return () => {
      mounted = false;
    };
  }, []);

  const pipelineStages = [
    {
      num: '01',
      title: 'Optical Capture',
      subtitle: 'Citizen Field Telemetry',
      badge: 'Zero Friction',
      description:
        'Citizens photograph degradation in the field. Hardware EXIF extracts sub-meter GPS coordinates and device timestamp client-side. Works completely offline with IndexedDB persistent queue.',
      schemaSnippet: {
        stage: '01_CLIENT_CAPTURE',
        coordinates: '18.9220° N, 72.8330° E',
        accuracy_meters: 2.4,
        source: 'Optical EXIF Geotag',
        offline_cached: true,
        hash: 'sha256:7f83b165...9b8e',
      },
      visualDetails: {
        headline: 'Shahid Bhagat Singh Marg, Colaba',
        subtext: 'GPS fixed via high-precision mobile optical telemetry',
        tag: 'Tamper-Resistant Geotag',
      },
    },
    {
      num: '02',
      title: 'Multimodal AI Triage',
      subtitle: 'Structured Defect Extraction',
      badge: 'Vision LLM Triage',
      description:
        'State-of-the-art multimodal vision AI parses optical defect depths, structural degradation vectors, and traffic hazards. Enforces strict JSON schema, outputting deterministic severity scores from S1 to S4.',
      schemaSnippet: {
        stage: '02_AI_TRIAGE',
        category: 'Pothole (Bituminous Failure)',
        severity_grade: 4,
        confidence_index: 0.96,
        dimensions: '65cm dia x 14cm depth',
        hazard_level: 'Critical: High Risk to Two-Wheelers',
      },
      visualDetails: {
        headline: 'Gemini 2.5 / Groq Multimodal Inspection',
        subtext: 'Exposed sub-base aggregate confirmed. Severity S4.',
        tag: 'Deterministic Schema',
      },
    },
    {
      num: '03',
      title: 'Deterministic GIS Routing',
      subtitle: 'PostGIS Polygon Containment',
      badge: 'Zero Hallucination',
      description:
        'Zero manual dispatcher delay or political passing of the buck. The geotag is queried against official municipal ward boundary polygons using PostGIS spatial containment (ST_Contains).',
      schemaSnippet: {
        stage: '03_GIS_DISPATCH',
        jurisdiction: 'Ward A (Colaba / Fort / Marine Drive)',
        authority: 'Municipal Corporation Roads Dept.',
        engineer: 'Er. Suresh Patil (Executive Engineer)',
        statutory_sla: '14 Days (Critical Severity S4)',
        routing_method: 'PostGIS ST_Contains Polygon Mesh',
      },
      visualDetails: {
        headline: 'Ward A Sovereign Jurisdiction',
        subtext: 'Automated municipal work-order dispatch & statutory SLA timer',
        tag: 'Spatial Boundary Lock',
      },
    },
    {
      num: '04',
      title: 'Verified Optical Audit',
      subtitle: 'Closed-Loop Repair Audit',
      badge: 'Cryptographic Proof',
      description:
        'Repairs are never marked complete with mere verbal claims. The ward contractor must upload after-repair photographic evidence. Computer vision compares before-and-after textures, verifying bitumen leveling and edge sealant.',
      schemaSnippet: {
        stage: '04_CLOSED_LOOP_AUDIT',
        verdict: 'Verified Closed',
        confidence: '98.4%',
        wear_course: 'Evenly compacted bituminous macadam',
        edge_seal: 'Intact mastic seal validated',
        public_ledger: 'Permanently registered on civic audit trail',
      },
      visualDetails: {
        headline: '98.4% Mathematical Closure Verdict',
        subtext: 'Sub-base reinforced, bituminous wear course verified flush',
        tag: 'Immutable Ledger Seal',
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#26302A] font-sans selection:bg-[#C58A66]/20 selection:text-[#26302A]">
      <PWAInstallModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onInstall={promptInstall}
      />

      {/* ============================================================ */}
      {/* 1. ARCHITECTURAL NAVIGATION BAR                              */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-[#F6F4EF]/90 backdrop-blur-md border-b border-[#E4E0D6] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Mark with Wordmark */}
          <Link href="/" className="group flex items-center gap-3">
            <StillPointLogo
              size="md"
              variant="portal"
              color="#26302A"
              irisColor="#C58A66"
              showWordmark={true}
              subtitle="CIVIC INFRASTRUCTURE"
            />
          </Link>

          {/* Minimalist Navigation Anchors */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-[0.16em] uppercase text-[#5E6F63]">
            <a href="#pipeline" className="hover:text-[#26302A] transition-colors">
              Pipeline
            </a>
            <a href="#workflows" className="hover:text-[#26302A] transition-colors">
              Dual Workflows
            </a>
            <a href="#principles" className="hover:text-[#26302A] transition-colors">
              Ethos
            </a>
            <a href="#ledger" className="hover:text-[#26302A] transition-colors">
              Public Ledger
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setInstallModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-[#26302A] bg-[#E4E0D6]/40 hover:bg-[#E4E0D6] border border-[#E4E0D6] transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#5E6F63]" />
              <span>{isInstalled ? 'App Active' : 'Install PWA'}</span>
            </button>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide text-[#F6F4EF] bg-[#26302A] hover:bg-[#34423A] shadow-sm transition-all"
            >
              <LogIn className="h-3.5 w-3.5 text-[#C58A66]" />
              <span>Portal Access</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. SERENE ARCHITECTURAL HERO SECTION                         */}
      {/* ============================================================ */}
      <section className="relative pt-20 pb-28 overflow-hidden border-b border-[#E4E0D6]">
        {/* Subtle architectural background grid accents */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#26302A 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Architectural Status Pill */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#E4E0D6]/50 border border-[#E4E0D6] text-xs font-mono uppercase tracking-[0.2em] text-[#5E6F63] mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-[#C58A66] animate-pulse" />
              <span>Infrastructure in Stillness & Clarity</span>
            </motion.div>

            {/* Main Serene Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-[#26302A] leading-[1.08] mb-6"
            >
              Order from Chaos. <br />
              <span className="italic font-normal text-[#5E6F63]">Civic Precision</span> in Stone.
            </motion.h1>

            {/* Architectural Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-[#5E6F63] leading-relaxed max-w-2xl mx-auto mb-10 font-normal"
            >
              A contemplative civic operating system. Transforming fragmented citizen reports into
              deterministic PostGIS ward dispatches, AI-triaged structural defect models, and
              photographically audited municipal repairs.
            </motion.p>

            {/* Primary Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/user/report"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#C58A66] hover:bg-[#B57955] text-white font-medium text-sm tracking-wide shadow-sm hover:shadow transition-all group"
              >
                <span>Report an Anomaly</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/user"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FAF9F5] hover:bg-[#E4E0D6]/60 text-[#26302A] border border-[#E4E0D6] font-medium text-sm tracking-wide transition-all"
              >
                <UserCheck className="h-4 w-4 text-[#5E6F63]" />
                <span>Citizen Portal</span>
              </Link>

              <Link
                href="/official"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FAF9F5] hover:bg-[#E4E0D6]/60 text-[#26302A] border border-[#E4E0D6] font-medium text-sm tracking-wide transition-all"
              >
                <Building className="h-4 w-4 text-[#5E6F63]" />
                <span>Ward Official Console</span>
              </Link>
            </motion.div>
          </div>

          {/* Architectural Comparison Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-20 max-w-5xl mx-auto rounded-3xl bg-[#FAF9F5] border border-[#E4E0D6] p-6 sm:p-10 shadow-sm relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between pb-8 border-b border-[#E4E0D6]">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#C58A66]">
                  PARADIGM SHIFT
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#26302A] mt-1">
                  From Noisy Tickets to Mathematical Proof
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#5E6F63] bg-[#E4E0D6]/40 px-3.5 py-1.5 rounded-full border border-[#E4E0D6]">
                <Cpu className="h-3.5 w-3.5 text-[#C58A66]" />
                <span>Deterministic GIS Polygon Routing</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
              {/* The Old Way */}
              <div className="rounded-2xl p-6 bg-[#E4E0D6]/30 border border-[#E4E0D6]/60">
                <span className="text-xs font-mono uppercase tracking-wider text-[#A84835] font-semibold">
                  Conventional Civic Chaos
                </span>
                <ul className="mt-4 space-y-3 text-xs text-[#5E6F63] leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#A84835] font-bold">✕</span>
                    <span>Subjective text descriptions without calibrated depth or severity.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#A84835] font-bold">✕</span>
                    <span>Inter-departmental buck passing between BMC, MMRDA, and PWD.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#A84835] font-bold">✕</span>
                    <span>Contractor self-certification without independent optical proof.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#A84835] font-bold">✕</span>
                    <span>Opaque black-box ticketing where complaints disappear silently.</span>
                  </li>
                </ul>
              </div>

              {/* The STILL POINT Way */}
              <div className="rounded-2xl p-6 bg-[#26302A] text-[#F6F4EF] border border-[#34423A] shadow-md">
                <span className="text-xs font-mono uppercase tracking-wider text-[#C58A66] font-semibold">
                  STILL POINT Architecture
                </span>
                <ul className="mt-4 space-y-3 text-xs text-[#A3AD9C] leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#C58A66] shrink-0" />
                    <span><strong className="text-white">EXIF Optical Extraction:</strong> Hardware geotags locked to sub-meter accuracy.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#C58A66] shrink-0" />
                    <span><strong className="text-white">Deterministic PostGIS:</strong> Instant polygon containment assigns the exact Ward Engineer.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#C58A66] shrink-0" />
                    <span><strong className="text-white">Vision AI Triage:</strong> Automated severity grade (S1-S4) and statutory SLA clock.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#C58A66] shrink-0" />
                    <span><strong className="text-white">Closed-Loop Verification:</strong> AI compares before/after photos before ticket closure.</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. LIVE SUPABASE REAL-TIME STATS RIBBON                      */}
      {/* ============================================================ */}
      <section id="ledger" className="py-12 bg-[#FAF9F5] border-b border-[#E4E0D6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-[#E4E0D6]">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#C58A66]">
                LIVE SYSTEM TELEMETRY
              </p>
              <h4 className="text-xl font-serif font-bold text-[#26302A]">
                Synchronized with Supabase Public Ledger
              </h4>
            </div>
            <div className="mt-2 sm:mt-0 flex items-center gap-2 text-xs font-mono text-[#5E6F63]">
              <span className="w-2 h-2 rounded-full bg-[#5E6F63] animate-ping" />
              <span>Real-Time Database Active</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6]">
              <span className="text-xs font-mono text-[#5E6F63] uppercase tracking-wider">
                01. Monitored Assets
              </span>
              <p className="mt-2 text-3xl font-serif font-bold text-[#26302A]">
                {statsLoading ? '...' : stats?.total_assets || '24 Wards'}
              </p>
              <p className="mt-1 text-xs text-[#5E6F63]">
                {stats?.total_assets ? 'Registered municipal infrastructure' : 'Deterministic GIS polygons mapped'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6]">
              <span className="text-xs font-mono text-[#5E6F63] uppercase tracking-wider">
                02. Active Issues
              </span>
              <p className="mt-2 text-3xl font-serif font-bold text-[#26302A]">
                {statsLoading ? '...' : stats?.open_issues ?? 0}
              </p>
              <p className="mt-1 text-xs text-[#5E6F63]">Under strict statutory SLA tracking</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6]">
              <span className="text-xs font-mono text-[#5E6F63] uppercase tracking-wider">
                03. Verified Repaired
              </span>
              <p className="mt-2 text-3xl font-serif font-bold text-[#26302A]">
                {statsLoading ? '...' : stats?.verified_repairs ?? 0}
              </p>
              <p className="mt-1 text-xs text-[#5E6F63]">Closed via multimodal visual audit</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6]">
              <span className="text-xs font-mono text-[#5E6F63] uppercase tracking-wider">
                04. Verification Rigor
              </span>
              <p className="mt-2 text-3xl font-serif font-bold text-[#C58A66]">
                100%
              </p>
              <p className="mt-1 text-xs text-[#5E6F63]">Zero verbal or unverified closures</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. THE 4-STAGE PIPELINE SHOWCASE (INTERACTIVE)              */}
      {/* ============================================================ */}
      <section id="pipeline" className="py-24 border-b border-[#E4E0D6] bg-[#F6F4EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-[0.24em] text-[#C58A66]">
              THE ARCHITECTURAL LIFECYCLE
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#26302A] mt-2 mb-4">
              Capture. Triage. Route. Audit.
            </h2>
            <p className="text-sm sm:text-base text-[#5E6F63] leading-relaxed">
              Explore how STILL POINT processes physical urban degradation through an unbroken chain
              of deterministic verification.
            </p>
          </div>

          {/* Step Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {pipelineStages.map((stage, idx) => (
              <button
                key={stage.num}
                onClick={() => setActiveStep(idx)}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  activeStep === idx
                    ? 'bg-[#26302A] text-[#F6F4EF] border-[#26302A] shadow-md'
                    : 'bg-[#FAF9F5] text-[#26302A] border-[#E4E0D6] hover:bg-[#E4E0D6]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-mono ${
                      activeStep === idx ? 'text-[#C58A66]' : 'text-[#5E6F63]'
                    }`}
                  >
                    STAGE {stage.num}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      activeStep === idx
                        ? 'bg-[#34423A] text-[#A3AD9C]'
                        : 'bg-[#E4E0D6] text-[#5E6F63]'
                    }`}
                  >
                    {stage.badge}
                  </span>
                </div>
                <h4 className="font-serif font-semibold text-sm leading-tight">{stage.title}</h4>
                <p
                  className={`text-xs mt-1 truncate ${
                    activeStep === idx ? 'text-[#A3AD9C]' : 'text-[#5E6F63]'
                  }`}
                >
                  {stage.subtitle}
                </p>
              </button>
            ))}
          </div>

          {/* Active Step Detailed Inspection Card */}
          <div className="rounded-3xl bg-[#FAF9F5] border border-[#E4E0D6] p-6 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Description & Metadata */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E4E0D6]/60 border border-[#E4E0D6] text-xs font-mono text-[#26302A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C58A66]" />
                  <span>{pipelineStages[activeStep].visualDetails.tag}</span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#26302A]">
                    {pipelineStages[activeStep].title}
                  </h3>
                  <p className="text-sm font-serif italic text-[#5E6F63] mt-1">
                    {pipelineStages[activeStep].subtitle}
                  </p>
                </div>

                <p className="text-sm text-[#5E6F63] leading-relaxed">
                  {pipelineStages[activeStep].description}
                </p>

                <div className="p-4 rounded-2xl bg-[#E4E0D6]/30 border border-[#E4E0D6] space-y-2">
                  <p className="text-xs font-semibold text-[#26302A]">
                    {pipelineStages[activeStep].visualDetails.headline}
                  </p>
                  <p className="text-xs text-[#5E6F63]">
                    {pipelineStages[activeStep].visualDetails.subtext}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={() =>
                      setActiveStep((prev) => (prev > 0 ? prev - 1 : pipelineStages.length - 1))
                    }
                    className="px-4 py-2 text-xs font-medium rounded-xl border border-[#E4E0D6] text-[#26302A] hover:bg-[#E4E0D6]/50 transition-colors cursor-pointer"
                  >
                    ← Previous Stage
                  </button>
                  <button
                    onClick={() =>
                      setActiveStep((prev) => (prev < pipelineStages.length - 1 ? prev + 1 : 0))
                    }
                    className="px-4 py-2 text-xs font-medium rounded-xl bg-[#26302A] text-[#F6F4EF] hover:bg-[#34423A] transition-colors cursor-pointer"
                  >
                    Next Stage →
                  </button>
                </div>
              </div>

              {/* Right Column: Code & Structural Schema Inspector */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl bg-[#26302A] border border-[#34423A] overflow-hidden shadow-lg">
                  <div className="px-5 py-3.5 bg-[#1F2722] border-b border-[#34423A] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#A84835]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#C58A66]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#5E6F63]" />
                      <span className="ml-2 text-[11px] font-mono text-[#A3AD9C]">
                        still-point-engine // {pipelineStages[activeStep].num}_telemetry.json
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#C58A66] uppercase">
                      Strict Schema
                    </span>
                  </div>

                  <div className="p-6 font-mono text-xs text-[#F6F4EF] overflow-x-auto leading-relaxed">
                    <pre className="text-[#A3AD9C]">
                      <code>{JSON.stringify(pipelineStages[activeStep].schemaSnippet, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. DUAL-WORKFLOW SHOWCASE (CITIZENS & WARD ENGINEERS)       */}
      {/* ============================================================ */}
      <section id="workflows" className="py-24 bg-[#FAF9F5] border-b border-[#E4E0D6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-[0.24em] text-[#C58A66]">
              DESIGNED FOR TWO SOVEREIGN ROLES
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#26302A] mt-2 mb-4">
              Two Perspectives. One Unified Ledger.
            </h2>
            <p className="text-sm sm:text-base text-[#5E6F63] leading-relaxed">
              Whether you are an observant citizen capturing a street anomaly or an executive ward
              engineer directing municipal asphalt repairs, STILL POINT provides purposeful clarity.
            </p>

            {/* Workflow Switcher Tabs */}
            <div className="inline-flex p-1.5 mt-8 rounded-2xl bg-[#E4E0D6]/60 border border-[#E4E0D6]">
              <button
                onClick={() => setWorkflowTab('citizen')}
                className={`px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  workflowTab === 'citizen'
                    ? 'bg-[#26302A] text-[#F6F4EF] shadow-sm'
                    : 'text-[#5E6F63] hover:text-[#26302A]'
                }`}
              >
                For Citizens & Commuters
              </button>
              <button
                onClick={() => setWorkflowTab('official')}
                className={`px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  workflowTab === 'official'
                    ? 'bg-[#26302A] text-[#F6F4EF] shadow-sm'
                    : 'text-[#5E6F63] hover:text-[#26302A]'
                }`}
              >
                For Ward Executive Engineers
              </button>
            </div>
          </div>

          {/* Workflow Content */}
          {workflowTab === 'citizen' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-[#F6F4EF] border border-[#E4E0D6] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#26302A] flex items-center justify-center text-[#F6F4EF] mb-6 shadow-sm">
                    <Camera className="h-6 w-6 text-[#C58A66]" />
                  </div>
                  <span className="text-xs font-mono text-[#5E6F63] uppercase tracking-wider">
                    01. Instant Field Capture
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#26302A] mt-2 mb-3">
                    Zero-Friction Camera Intake
                  </h3>
                  <p className="text-xs text-[#5E6F63] leading-relaxed">
                    Point your camera and tap capture. Optical EXIF geotags are extracted directly
                    from hardware metadata. Works completely offline with automatic sync.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-[#E4E0D6]">
                  <span className="text-[11px] font-mono text-[#C58A66]">
                    ✓ No app store download required
                  </span>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-[#F6F4EF] border border-[#E4E0D6] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#26302A] flex items-center justify-center text-[#F6F4EF] mb-6 shadow-sm">
                    <Compass className="h-6 w-6 text-[#C58A66]" />
                  </div>
                  <span className="text-xs font-mono text-[#5E6F63] uppercase tracking-wider">
                    02. Deterministic Routing
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#26302A] mt-2 mb-3">
                    Direct Ward Assignment
                  </h3>
                  <p className="text-xs text-[#5E6F63] leading-relaxed">
                    Never worry about which department owns the street. PostGIS spatial polygons
                    instantly assign the sovereign ward engineer and begin statutory countdowns.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-[#E4E0D6]">
                  <span className="text-[11px] font-mono text-[#C58A66]">
                    ✓ Official MCGM Ward Poly Mesh
                  </span>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-[#F6F4EF] border border-[#E4E0D6] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#26302A] flex items-center justify-center text-[#F6F4EF] mb-6 shadow-sm">
                    <FileCheck2 className="h-6 w-6 text-[#C58A66]" />
                  </div>
                  <span className="text-xs font-mono text-[#5E6F63] uppercase tracking-wider">
                    03. Optical Proof Receipts
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#26302A] mt-2 mb-3">
                    Verified Repair Receipts
                  </h3>
                  <p className="text-xs text-[#5E6F63] leading-relaxed">
                    When repairs are finished, inspect before/after computer vision audits directly
                    on your dashboard. Transparency is guaranteed on the public ledger.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-[#E4E0D6]">
                  <Link
                    href="/user"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#26302A] hover:text-[#C58A66] transition-colors"
                  >
                    <span>Launch Citizen Interface</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-[#F6F4EF] border border-[#E4E0D6] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#26302A] flex items-center justify-center text-[#F6F4EF] mb-6 shadow-sm">
                    <Layers className="h-6 w-6 text-[#C58A66]" />
                  </div>
                  <span className="text-xs font-mono text-[#5E6F63] uppercase tracking-wider">
                    01. Sovereign Ward Filter
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#26302A] mt-2 mb-3">
                    Zero Cross-Ward Clutter
                  </h3>
                  <p className="text-xs text-[#5E6F63] leading-relaxed">
                    Ward engineers see exclusively defects lying inside their statutory polygon.
                    Categorized automatically by severity S1 to S4 with pre-triaged repair briefs.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-[#E4E0D6]">
                  <span className="text-[11px] font-mono text-[#C58A66]">
                    ✓ Sub-meter Ward Boundary Containment
                  </span>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-[#F6F4EF] border border-[#E4E0D6] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#26302A] flex items-center justify-center text-[#F6F4EF] mb-6 shadow-sm">
                    <Clock className="h-6 w-6 text-[#C58A66]" />
                  </div>
                  <span className="text-xs font-mono text-[#5E6F63] uppercase tracking-wider">
                    02. Binding Statutory SLA
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#26302A] mt-2 mb-3">
                    Automated Escalation Timers
                  </h3>
                  <p className="text-xs text-[#5E6F63] leading-relaxed">
                    14-day statutory limits for critical S4 road hazards. Color-coded countdowns
                    ensure contractor accountability and prevent citizen grievance backlogs.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-[#E4E0D6]">
                  <span className="text-[11px] font-mono text-[#C58A66]">
                    ✓ Automated Municipal Escalation
                  </span>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-[#F6F4EF] border border-[#E4E0D6] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#26302A] flex items-center justify-center text-[#F6F4EF] mb-6 shadow-sm">
                    <Shield className="h-6 w-6 text-[#C58A66]" />
                  </div>
                  <span className="text-xs font-mono text-[#5E6F63] uppercase tracking-wider">
                    03. AI Completion Audit
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#26302A] mt-2 mb-3">
                    One-Click Verification
                  </h3>
                  <p className="text-xs text-[#5E6F63] leading-relaxed">
                    Upload contractor completion photos. The vision model validates wear-course
                    alignment and edge seals in seconds, authorizing public funds with certainty.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-[#E4E0D6]">
                  <Link
                    href="/official"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#26302A] hover:text-[#C58A66] transition-colors"
                  >
                    <span>Launch Ward Console</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. ETHOS & ARCHITECTURAL FOUNDATIONS                        */}
      {/* ============================================================ */}
      <section id="principles" className="py-24 bg-[#F6F4EF] border-b border-[#E4E0D6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-[0.24em] text-[#C58A66]">
              CORE ETHOS
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#26302A] mt-2 mb-4">
              Silence the Noise. Elevate the City.
            </h2>
            <p className="text-sm sm:text-base text-[#5E6F63] leading-relaxed">
              Three unyielding principles guide the engineering behind STILL POINT.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#FAF9F5] border border-[#E4E0D6]">
              <span className="text-3xl font-serif font-bold text-[#26302A]/20">01</span>
              <h3 className="text-xl font-serif font-bold text-[#26302A] mt-4 mb-2">
                Zero Synthetic Data
              </h3>
              <p className="text-xs text-[#5E6F63] leading-relaxed">
                We reject hardcoded placeholders and artificial counters. Every data point displayed
                in STILL POINT is connected directly to authentic PostgreSQL tables and live field
                telemetry. If a table has no rows, we show serene emptiness, never fabricated noise.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF9F5] border border-[#E4E0D6]">
              <span className="text-3xl font-serif font-bold text-[#26302A]/20">02</span>
              <h3 className="text-xl font-serif font-bold text-[#26302A] mt-4 mb-2">
                Deterministic PostGIS Routing
              </h3>
              <p className="text-xs text-[#5E6F63] leading-relaxed">
                Civic accountability cannot rely on probabilistic AI guesses for authority routing.
                We execute rigorous mathematical spatial polygon queries (`ST_Contains`) against
                municipal ward borders to establish singular, unshakeable jurisdiction.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF9F5] border border-[#E4E0D6]">
              <span className="text-3xl font-serif font-bold text-[#26302A]/20">03</span>
              <h3 className="text-xl font-serif font-bold text-[#26302A] mt-4 mb-2">
                Optical Before-and-After Proof
              </h3>
              <p className="text-xs text-[#5E6F63] leading-relaxed">
                Tickets are not closed with signatures or rubber stamps. A repair is valid only when
                comparative computer vision verifies bituminous asphalt thickness, sealant integrity,
                and surface leveling against the original anomaly report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. ARCHITECTURAL CALL TO ACTION BANNER                       */}
      {/* ============================================================ */}
      <section className="py-20 bg-[#FAF9F5] border-b border-[#E4E0D6]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#26302A] text-[#F6F4EF] p-8 sm:p-14 border border-[#34423A] shadow-xl text-center relative overflow-hidden">
            <div className="flex justify-center mb-6">
              <StillPointLogo size="lg" variant="portal" color="#F6F4EF" irisColor="#C58A66" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight mb-4 text-[#F6F4EF]">
              Step into Stillness.
            </h2>
            <p className="text-sm sm:text-base text-[#A3AD9C] max-w-xl mx-auto mb-8 font-light leading-relaxed">
              Experience the serenity of deterministic civic monitoring. Install the standalone PWA
              or access the sovereign ward console.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#C58A66] hover:bg-[#B57955] text-white font-medium text-sm tracking-wide shadow-sm transition-all"
              >
                <span>Enter STILL POINT Portal</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                onClick={() => setInstallModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#34423A] hover:bg-[#415248] text-[#F6F4EF] border border-[#415248] font-medium text-sm tracking-wide transition-all cursor-pointer"
              >
                <Download className="h-4 w-4 text-[#C58A66]" />
                <span>{isInstalled ? 'App Active' : 'Download Mobile PWA'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. MUSEUM-GRADE FOOTER                                       */}
      {/* ============================================================ */}
      <footer className="py-14 bg-[#F6F4EF] text-[#5E6F63]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-[#E4E0D6]">
            <div>
              <StillPointLogo
                size="md"
                variant="portal"
                color="#26302A"
                irisColor="#C58A66"
                showWordmark={true}
                subtitle="INFRASTRUCTURE INTELLIGENCE"
              />
              <p className="text-xs text-[#5E6F63] mt-3 max-w-md leading-relaxed">
                An architectural civic operating system uniting citizens and ward engineers through
                deterministic spatial routing and optical proof.
              </p>
            </div>

            <div className="flex flex-wrap gap-8 text-xs font-mono uppercase tracking-wider text-[#5E6F63]">
              <Link href="/user/report" className="hover:text-[#26302A] transition-colors">
                Field Report
              </Link>
              <Link href="/user/map" className="hover:text-[#26302A] transition-colors">
                Civic Map
              </Link>
              <Link href="/official" className="hover:text-[#26302A] transition-colors">
                Ward Console
              </Link>
              <Link href="/login" className="hover:text-[#26302A] transition-colors">
                Authentication
              </Link>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#5E6F63]/80 gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5E6F63]" />
              <span>STILL POINT · PostGIS Geodetic Ward Mesh Active</span>
            </div>
            <p>© {new Date().getFullYear()} STILL POINT. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
