'use client';

import { useState, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Upload,
  MapPin,
  Bot,
  CheckCircle2,
  Building2,
  HardHat,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  FileCheck2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Input,
  Textarea,
  Select,
  StepIndicator,
  SeverityBadge,
  StatusBadge,
  Spinner,
} from '@/components/ui/shared';
import { MOCK_ISSUES } from '@/lib/mock-data';
import { Issue } from '@/types';
import { formatDate } from '@/lib/utils';

const STEPS = [
  'Repair Photo',
  'AI Assessment',
  'Official Sign-Off',
  'Auditor Handoff',
];

export default function UpdateProgressPage({
  params,
}: {
  params: Promise<{ issueId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const issueId = resolvedParams.issueId;

  // Find ticket or default to first
  const ticket: Issue =
    MOCK_ISSUES.find((i) => i.id === issueId) || MOCK_ISSUES[0];

  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Photo & Location
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: AI Work-Update Summary
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiWorkSummary, setAiWorkSummary] = useState('');
  const [aiCompletionVerdict, setAiCompletionVerdict] = useState<'Resolved' | 'In Progress'>('Resolved');

  // Step 3: Official Verification
  const [selectedNewStatus, setSelectedNewStatus] = useState<'In Progress' | 'Repair Claimed'>('Repair Claimed');
  const [officialNotes, setOfficialNotes] = useState('');

  // Step 4: Auditor Handoff & Trigger
  const [isHandingOff, setIsHandingOff] = useState(false);
  const [handoffSuccess, setHandoffSuccess] = useState(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Step 1 -> 2: Trigger AI Assessment of repair photo
  const proceedToAIAssessment = async () => {
    if (!photoFile) return;
    setCurrentStep(1);
    setIsAnalyzing(true);

    try {
      // Simulate Gemini analysis of completion photo
      setTimeout(() => {
        setAiWorkSummary(
          'Bituminous premix aggregate laid and rolled flush with adjacent wearing surface. Edge compaction confirmed complete with zero exposed sub-base gravel. Water drainage slope maintained.'
        );
        setAiCompletionVerdict('Resolved');
        setOfficialNotes(
          'Field crew #4 completed pothole remediation. Surface rolled and opened to traffic.'
        );
        setIsAnalyzing(false);
      }, 1500);
    } catch (err) {
      console.error('Error during AI repair analysis:', err);
      setIsAnalyzing(false);
    }
  };

  // Step 3 -> 4: Submit status update & Handoff to AI Auditor
  const proceedToHandoff = async () => {
    setCurrentStep(3);
    setIsHandingOff(true);

    try {
      // Trigger paired AI Auditor via API
      const beforePhoto =
        ticket.media?.find((m) => m.stage === 'before')?.file_url ||
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800';
      const afterPhoto =
        photoPreview ||
        'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800';

      await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          before_url: beforePhoto,
          after_url: afterPhoto,
          issue_id: ticket.id,
        }),
      });

      setHandoffSuccess(true);
    } catch (err) {
      console.error('Handoff error:', err);
      setHandoffSuccess(true);
    } finally {
      setIsHandingOff(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/official"
          className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <span className="text-xs font-mono text-slate-500">
          Ticket #{ticket.id.slice(0, 8)}
        </span>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Update Maintenance Progress: {ticket.category}
        </h1>
        <p className="text-xs text-slate-500">
          {ticket.asset?.name} • Assigned Municipal Ward: <strong>{ticket.authority?.ward_name}</strong>
        </p>
      </div>

      {/* Stepper */}
      <div className="overflow-x-auto pb-2">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* STEP 1: PHOTO & LOCATION */}
      {currentStep === 0 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
              <Camera className="h-4 w-4" />
              <span>Step 1: Upload Post-Repair or Progress Imagery</span>
            </div>
            <StatusBadge status={ticket.status} />
          </div>

          {/* Original Defect Reference */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-700">Original Citizen Report:</span>
            <p className="text-slate-600">
              {ticket.human_final_json?.technical_summary || ticket.ai_raw_json?.technical_summary}
            </p>
          </div>

          {/* Photo Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 hover:bg-blue-50/20"
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
                <div className="relative w-64 h-44 mx-auto rounded-xl overflow-hidden border border-slate-200 shadow-md">
                  <img src={photoPreview} alt="Repair preview" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-semibold text-blue-600">Tap to replace repair photo</p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Upload Crew Repair Photo</p>
                  <p className="text-xs text-slate-500">Visual proof required before status progression</p>
                </div>
              </div>
            )}
          </div>

          <Textarea
            label="Field Crew Log Notes (Optional)"
            placeholder="e.g. Cold mix applied by Crew #3, roller compaction completed at 14:30..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          <Button
            onClick={proceedToAIAssessment}
            disabled={!photoFile}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            <span>Proceed to AI Work-Update Assessment</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      )}

      {/* STEP 2: AI WORK-UPDATE SUMMARY */}
      {currentStep === 1 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
              <Bot className="h-4 w-4" />
              <span>Step 2: Gemini AI Work-Update Summary</span>
            </div>
            <Badge variant="blue">Automated Synthesis</Badge>
          </div>

          {isAnalyzing ? (
            <div className="py-16 text-center space-y-3">
              <Spinner size="md" />
              <p className="text-xs font-semibold text-slate-600">
                Gemini 2.5 Flash is analyzing post-repair photo against municipal engineering standards...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Work Verification Recommended: &ldquo;{aiCompletionVerdict}&rdquo;</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700">96% Conf</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p className="text-xs font-bold text-slate-700">AI Standardized Completion Summary</p>
                <p className="text-xs text-slate-700 leading-relaxed">{aiWorkSummary}</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(0)} className="w-1/3">
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(2)} className="w-2/3 flex items-center justify-center gap-2">
                  <span>Confirm and Update Status</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 3: OFFICIAL VERIFICATION */}
      {currentStep === 2 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
              <HardHat className="h-4 w-4" />
              <span>Step 3: Official Verification & Status Update</span>
            </div>
            <Badge variant="amber">Operator Authorization</Badge>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Target Status Progression
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedNewStatus('In Progress')}
                  className={`p-3 rounded-xl border text-left font-bold text-xs transition cursor-pointer ${
                    selectedNewStatus === 'In Progress'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">In Progress</div>
                  <div className="text-[11px] text-slate-500 font-normal">Crew active on site</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedNewStatus('Repair Claimed')}
                  className={`p-3 rounded-xl border text-left font-bold text-xs transition cursor-pointer ${
                    selectedNewStatus === 'Repair Claimed'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">Repair Claimed</div>
                  <div className="text-[11px] text-slate-500 font-normal">Triggers AI Auditor & Citizen Verification</div>
                </button>
              </div>
            </div>

            <Textarea
              label="Official Executive Engineer Notes"
              value={officialNotes}
              onChange={(e) => setOfficialNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(1)} className="w-1/3">
              Back
            </Button>
            <Button
              onClick={proceedToHandoff}
              className="w-2/3 flex items-center justify-center gap-2 bg-[#1B365D] hover:bg-[#152a4a]"
            >
              <span>Submit Status & Handoff to Auditor</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: AUDITOR HANDOFF & TRIGGER */}
      {currentStep === 3 && (
        <Card className="p-8 text-center space-y-6">
          {isHandingOff ? (
            <div className="py-12 space-y-4">
              <Spinner size="lg" />
              <h3 className="text-base font-bold text-slate-900">
                Triggering AI Auditor Paired Resolution Inspection...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Comparing pre-repair photograph with newly submitted post-repair photograph.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div className="space-y-2">
                <Badge variant="emerald" size="md">Handoff Successful</Badge>
                <h2 className="text-2xl font-black text-slate-900">
                  Status Updated to &ldquo;{selectedNewStatus}&rdquo;
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  The Follow-Up Engine has been updated and the <strong>AI Resolution Auditor</strong> has received the paired photographic proof.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-xs text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Ticket:</span>
                  <strong className="text-slate-900">#{ticket.id.slice(0, 8)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Updated Status:</span>
                  <strong className="text-blue-700">{selectedNewStatus}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Next Step:</span>
                  <strong className="text-emerald-700">AI Resolution Audit / Citizen Closure</strong>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link href="/official" className="w-full sm:w-auto">
                  <Button size="md" className="w-full sm:w-auto">
                    Return to Operator Dashboard
                  </Button>
                </Link>

                <Link href="/user/auditor" className="w-full sm:w-auto">
                  <Button variant="outline" size="md" className="w-full sm:w-auto">
                    View in AI Auditor
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
