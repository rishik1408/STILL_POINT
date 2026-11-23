'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Download,
  LogIn,
  ArrowRight,
  Sparkles,
  MapPin,
  Bot,
  Compass,
  CheckCircle2,
  Building2,
  User,
  Activity,
  Layers,
  FileCheck2,
  AlertTriangle,
  Smartphone,
  ChevronRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Button, Badge, Card, StatCard } from '@/components/ui/shared';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';
import { PWAInstallModal } from '@/components/landing/PWAInstallModal';
import { MOCK_STATS } from '@/lib/mock-data';

export default function LandingPage() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [activeDemoStep, setActiveDemoStep] = useState<number>(0);

  const demoSteps = [
    {
      title: '1. Photo & EXIF GPS',
      subtitle: 'Citizen Field Capture',
      badge: 'Zero Friction',
      content: {
        image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
        metadata: {
          location: '18.9220° N, 72.8330° E',
          address: 'Shahid Bhagat Singh Marg, Colaba',
          timestamp: '23 Nov 2026, 15:42 IST',
          device: 'Mobile Camera (EXIF Geotagged)',
        },
      },
    },
    {
      title: '2. Gemini 2.5 AI Triage',
      subtitle: 'Structured Extraction',
      badge: 'Schema Enforced',
      content: {
        rawJson: {
          defect_category: 'Pothole',
          severity: 4,
          confidence: 0.94,
          technical_summary:
            'Deep pothole measuring approx 65cm diameter and 14cm depth on lane 2. Exposed sub-base aggregate visible. Critical two-wheeler hazard.',
        },
      },
    },
    {
      title: '3. Deterministic GIS Routing',
      subtitle: 'PostGIS Polygon Lookup',
      badge: 'No Hallucinations',
      content: {
        routing: {
          jurisdiction: 'Ward A (Colaba / Fort / Marine Drive)',
          department: 'Roads & Traffic Engineering Dept.',
          contact: 'Er. Suresh Patil (Executive Engineer)',
          email: 'ward.a.roads@mcgm.gov.in',
          sla: '14 Days (Critical Severity S4)',
        },
      },
    },
    {
      title: '4. AI Before/After Audit',
      subtitle: 'Multimodal Verification',
      badge: 'Closed-Loop Proof',
      content: {
        audit: {
          verdict: 'Resolved',
          confidence: '98%',
          reasoning:
            'Bituminous macadam patch fully leveled with existing wear course. Sub-base reinforced, edge sealant confirmed intact.',
          status: 'Verified Closed & Logged to Public Ledger',
        },
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <PWAInstallModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onInstall={promptInstall}
      />

      {/* Top Civic Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#1B365D] flex items-center justify-center text-white shadow-md">
              <ShieldAlert className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#1B365D]">PIAMS</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#1D4ED8] border border-blue-200">
                Civic Infrastructure
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#showcase" className="hover:text-[#1D4ED8] transition">Live Pipeline</a>
            <a href="#dual-pipeline" className="hover:text-[#1D4ED8] transition">Dual Architecture</a>
            <a href="#stats" className="hover:text-[#1D4ED8] transition">Ward Metrics</a>
            <a href="#how-it-works" className="hover:text-[#1D4ED8] transition">How It Works</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInstallModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download App</span>
              <span className="sm:hidden">App</span>
            </Button>

            <Link href="/login">
              <Button size="sm" className="flex items-center gap-1.5 bg-[#1B365D] hover:bg-[#152a4a]">
                <LogIn className="h-4 w-4" />
                <span>Portal Login</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="blue" size="md" className="py-1 px-3 border border-blue-200 bg-blue-50 text-blue-800">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                AI-Assisted Civic Infrastructure Platform
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1B365D] tracking-tight leading-[1.15]"
            >
              Smarter Roads, Bridges & Footpaths with{' '}
              <span className="text-[#1D4ED8] underline decoration-blue-300 decoration-wavy decoration-2">
                Verified AI Auditing
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 leading-relaxed"
            >
              Empowering citizens to report municipal hazards in 60 seconds with camera EXIF GPS, routing tickets deterministically through PostGIS wards, and holding civic agencies accountable with paired before-and-after photo verification.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Button
                size="lg"
                onClick={() => setInstallModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/20 text-base"
              >
                <Download className="h-5 w-5" />
                <span>Download Field App (PWA)</span>
              </Button>

              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-base bg-[#1B365D] hover:bg-[#152a4a]"
                >
                  <LogIn className="h-5 w-5 text-blue-300" />
                  <span>Log In to Online Portal</span>
                </Button>
              </Link>
            </motion.div>

            {/* Target Assets Chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500"
            >
              <span className="font-semibold text-slate-700">Monitored Assets:</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">🛣️ Municipal Roads</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">🚏 Bus Stops & Shelters</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">🚶 Pedestrian Footpaths</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">🌉 Pedestrian Overbridges</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Preview Stats Section */}
      <section id="stats" className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1B365D]">847</div>
              <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">Infrastructure Assets Monitored</p>
            </div>
            <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-100 text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1D4ED8]">23</div>
              <p className="mt-1 text-xs sm:text-sm font-medium text-blue-800">Active Open Issues</p>
            </div>
            <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#15803D]">312</div>
              <p className="mt-1 text-xs sm:text-sm font-medium text-emerald-800">Verified Repairs Closed</p>
            </div>
            <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-700">100%</div>
              <p className="mt-1 text-xs sm:text-sm font-medium text-amber-800">Deterministic GIS Ward Routing</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Feature Showcase Section */}
      <section id="showcase" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="blue" className="mb-3">Interactive Demo</Badge>
            <h2 className="text-3xl font-extrabold text-[#1B365D] tracking-tight">
              The PIAMS End-to-End Pipeline
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Click through the 4 stages below to see how a smartphone photo transforms into a verified municipal repair.
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {demoSteps.map((step, idx) => (
              <button
                key={step.title}
                onClick={() => setActiveDemoStep(idx)}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
                  activeDemoStep === idx
                    ? 'bg-[#1B365D] text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{step.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeDemoStep === idx ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-100 text-slate-500'}`}>
                  {step.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Interactive Card */}
          <Card className="max-w-4xl mx-auto overflow-hidden border border-slate-200 shadow-xl bg-white">
            <div className="p-6 sm:p-8">
              {activeDemoStep === 0 && (
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={demoSteps[0].content.image}
                      alt="Pothole capture"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/70 backdrop-blur-xs text-[11px] text-white font-mono flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-red-400" />
                      <span>18.9220° N, 72.8330° E</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                      <Smartphone className="h-4 w-4" />
                      <span>Step 1: Public Citizen Capture</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Geotagged Camera Capture
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Citizen snaps a photograph in the PWA. Embedded EXIF metadata automatically provides GPS coordinates and precise capture timestamp with zero manual typing.
                    </p>
                    <div className="rounded-xl bg-slate-50 p-3.5 space-y-2 text-xs font-mono text-slate-700 border border-slate-100">
                      <div><strong className="text-slate-500">Location:</strong> 18.9220° N, 72.8330° E</div>
                      <div><strong className="text-slate-500">Road Corridor:</strong> Shahid Bhagat Singh Marg, Colaba</div>
                      <div><strong className="text-slate-500">Timestamp:</strong> 23 Nov 2026, 15:42 IST</div>
                      <div><strong className="text-slate-500">Input Mode:</strong> Offline Cached (IndexedDB Dexie.js)</div>
                    </div>
                  </div>
                </div>
              )}

              {activeDemoStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                      <Bot className="h-4 w-4" />
                      <span>Step 2: Gemini 2.5 Flash Triage</span>
                    </div>
                    <Badge variant="blue">Strict JSON Schema</Badge>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Multimodal Defect Classification & Severity Score
                  </h3>
                  <p className="text-xs text-slate-600">
                    Gemini 2.5 Flash analyzes the image bytes directly against an engineering defect taxonomy, assigning severity levels (1–4) and technical assessment without human intervention.
                  </p>
                  <div className="rounded-xl bg-[#0F172A] p-4 text-xs font-mono text-emerald-400 overflow-x-auto shadow-inner">
                    <pre>{JSON.stringify(demoSteps[1].content.rawJson, null, 2)}</pre>
                  </div>
                </div>
              )}

              {activeDemoStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                      <Compass className="h-4 w-4" />
                      <span>Step 3: Deterministic PostGIS Ward Routing</span>
                    </div>
                    <Badge variant="emerald">PostGIS ST_Contains</Badge>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Zero AI Hallucinations in Municipal Jurisdiction
                  </h3>
                  <p className="text-xs text-slate-600">
                    Unlike naive LLM wrappers that guess municipal contacts, PIAMS uses spatial PostGIS queries to map the exact GPS point into the municipal ward boundary polygon.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                      <p className="text-xs font-bold text-blue-900">Mapped Municipal Ward</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">Ward A (Colaba / Fort / Marine Drive)</p>
                      <p className="text-xs text-slate-500 mt-0.5">MCGM Southern Division</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold text-slate-700">Designated Authority & SLA</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">Er. Suresh Patil (Exec. Engineer)</p>
                      <p className="text-xs text-red-600 font-semibold mt-0.5">SLA: 14 Days (Critical S4)</p>
                    </div>
                  </div>
                </div>
              )}

              {activeDemoStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Step 4: Paired Before-and-After AI Auditor</span>
                    </div>
                    <Badge variant="emerald">Verdict: Resolved (98% Conf)</Badge>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Verifiable Visual Proof Before Final Ticket Closure
                  </h3>
                  <p className="text-xs text-slate-600">
                    Municipal crews cannot self-certify repairs without photographic evidence. The AI Auditor evaluates paired pre-repair and post-repair photographs to prevent cosmetic patches.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Pre-Repair (Citizen Photo)</span>
                      <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        <img
                          src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80"
                          alt="Before repair"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-emerald-600 uppercase">Post-Repair (Crew Photo)</span>
                      <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-emerald-200 ring-2 ring-emerald-500/20">
                        <img
                          src="https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80"
                          alt="After repair"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100 text-xs text-emerald-900 space-y-1">
                    <p className="font-semibold">AI Auditor Reasoning:</p>
                    <p className="text-emerald-800">
                      Bituminous macadam patch fully leveled with existing wear course. Sub-base reinforced, edge sealant confirmed intact. Low-risk verdict passed; ticket closed on public registry.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setActiveDemoStep((prev) => (prev > 0 ? prev - 1 : 3))}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                ← Previous Stage
              </button>
              <span className="text-xs font-medium text-slate-400">
                Stage {activeDemoStep + 1} of {demoSteps.length}
              </span>
              <button
                onClick={() => setActiveDemoStep((prev) => (prev < 3 ? prev + 1 : 0))}
                className="text-xs font-semibold text-[#1D4ED8] hover:text-blue-800 transition"
              >
                Next Stage →
              </button>
            </div>
          </Card>
        </div>
      </section>

      {/* Dual Pipeline Visual Explanation Section */}
      <section id="dual-pipeline" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="blue" className="mb-3">Architecture</Badge>
            <h2 className="text-3xl font-extrabold text-[#1B365D] tracking-tight">
              Dual-Pipeline System Architecture
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Clear segregation of roles enforced by Supabase Row-Level Security (RLS) while sharing an immutable public ledger.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* Citizen Pipeline */}
            <div className="rounded-2xl p-8 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 border border-blue-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Public Citizen Pipeline</h3>
                      <p className="text-xs text-slate-500">Accessible PWA Reporting & Live Tracking</p>
                    </div>
                  </div>
                  <Badge variant="blue">Role: user</Badge>
                </div>

                <div className="space-y-4 my-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold text-xs">1</div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Snap Photo with Camera</p>
                      <p className="text-xs text-slate-500">Auto-extracts EXIF GPS coordinates and timestamp</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold text-xs">2</div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">AI Triage (Gemini 2.5 Flash)</p>
                      <p className="text-xs text-slate-500">Determines defect type, severity 1–4, and technical description</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold text-xs">3</div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">One-Tap Citizen Confirmation</p>
                      <p className="text-xs text-slate-500">Review AI draft, add optional notes, commit to database</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold text-xs">4</div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Track Live Repair & Audit</p>
                      <p className="text-xs text-slate-500">Monitor SLA countdown and verify before-and-after photo resolution</p>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/user">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <span>Explore Citizen Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Municipal Officials Pipeline */}
            <div className="rounded-2xl p-8 bg-gradient-to-br from-slate-900 via-[#1B365D] to-slate-900 text-white shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-amber-500 text-slate-900 shadow-md">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Municipal Officials Pipeline</h3>
                      <p className="text-xs text-slate-300">Ward-Scoped Execution & Audit Sign-Off</p>
                    </div>
                  </div>
                  <Badge variant="amber" className="bg-amber-400/20 text-amber-300 border border-amber-400/30">Role: official</Badge>
                </div>

                <div className="space-y-4 my-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white font-bold text-xs">A</div>
                    <div>
                      <p className="text-xs font-semibold text-white">Ward Ticket Intake</p>
                      <p className="text-xs text-slate-300">Auto-routed tickets filtered strictly by assigned municipal polygon</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white font-bold text-xs">B</div>
                    <div>
                      <p className="text-xs font-semibold text-white">Crew Dispatch & SLA Monitoring</p>
                      <p className="text-xs text-slate-300">Assign maintenance crew, monitor 14/30-day escalation deadlines</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white font-bold text-xs">C</div>
                    <div>
                      <p className="text-xs font-semibold text-white">Submit Post-Repair Imagery</p>
                      <p className="text-xs text-slate-300">Crew captures completed repair photo, marks &ldquo;Repair Claimed&rdquo;</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white font-bold text-xs">D</div>
                    <div>
                      <p className="text-xs font-semibold text-white">AI Auditor Resolution Sign-Off</p>
                      <p className="text-xs text-slate-300">Paired AI audit verifies work quality (&lt;0.85 conf triggers human review)</p>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/official">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
                  <span>Enter Operator Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainable Development Goals Banner */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-400 font-bold">United Nations SDG Alignment</p>
              <h3 className="text-xl font-bold mt-1">Direct Contribution to Sustainable Urban Infrastructure</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Advancing SDG 9 (Resilient Infrastructure), SDG 11 (Sustainable Cities), SDG 16 (Transparent Institutions), and SDG 3 (Halving Traffic Injuries).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold border border-white/10">SDG 9</span>
              <span className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold border border-white/10">SDG 11</span>
              <span className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold border border-white/10">SDG 16</span>
              <span className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold border border-white/10">SDG 3</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#1B365D] flex items-center justify-center text-white">
              <ShieldAlert className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-slate-900">PIAMS (Public Infrastructure Asset Monitoring System)</p>
              <p className="text-slate-400">Department of Computer Science & Engineering • Dr. Usha M, Associate Professor</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[#1D4ED8] transition">Portal Sign In</Link>
            <Link href="/user/map" className="hover:text-[#1D4ED8] transition">Public Map</Link>
            <Link href="/user/report" className="hover:text-[#1D4ED8] transition">Report Issue</Link>
            <Link href="/official" className="hover:text-[#1D4ED8] transition">Officials Queue</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
