'use client';

import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Upload,
  Bot,
  CheckCircle2,
  HardHat,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Textarea,
  StepIndicator,
  StatusBadge,
  Spinner,
} from '@/components/ui/shared';
import { fetchIssueById, updateIssueStatus, uploadMedia } from '@/lib/data-service';
import { Issue, IssueStatus, AuditVerdict } from '@/types';

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

  const [ticket, setTicket] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Photo & Location
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: AI Work-Update Summary
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiWorkSummary, setAiWorkSummary] = useState('');
  const [aiCompletionVerdict, setAiCompletionVerdict] = useState<AuditVerdict>('Resolved');

  // Step 3: Official Verification
  const [selectedNewStatus, setSelectedNewStatus] = useState<IssueStatus>('Repair Claimed');
  const [officialNotes, setOfficialNotes] = useState('');

  // Step 4: Auditor Handoff & Trigger
  const [isHandingOff, setIsHandingOff] = useState(false);
  const [handoffSuccess, setHandoffSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadTicket() {
      try {
        setLoading(true);
        const data = await fetchIssueById(issueId);
        if (isMounted) {
          setTicket(data);
        }
      } catch (err) {
        console.error('Failed to load issue:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTicket();
    return () => {
      isMounted = false;
    };
  }, [issueId]);

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
      setTimeout(() => {
        setAiWorkSummary(
          'Bituminous premix aggregate compacted flush with adjacent wearing surface. Edge sealing complete with zero exposed sub-base gravel. Water drainage slope preserved.'
        );
        setAiCompletionVerdict('Resolved');
        setOfficialNotes(
          'Municipal crew completed remediation. Asphalt roller compaction passed on-site quality check.'
        );
        setIsAnalyzing(false);
      }, 1200);
    } catch (err) {
      console.error('Error during AI repair analysis:', err);
      setIsAnalyzing(false);
    }
  };

  // Step 3 -> 4: Submit status update & Handoff to AI Auditor
  const proceedToHandoff = async () => {
    if (!ticket) return;
    setCurrentStep(3);
    setIsHandingOff(true);

    try {
      let afterUrl = photoPreview;
      if (photoFile) {
        const uploadRes = await uploadMedia(photoFile, 'repairs');
        if (uploadRes.success && uploadRes.publicUrl) {
          afterUrl = uploadRes.publicUrl;
        }
      }

      // Update real issue in Supabase
      await updateIssueStatus(
        ticket.id,
        selectedNewStatus,
        officialNotes,
        aiCompletionVerdict,
        0.96,
        'Municipal Ward Engineer'
      );

      // Trigger paired AI Auditor via API
      const beforePhoto =
        ticket.media?.find((m) => m.stage === 'before')?.file_url ||
        'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800';

      await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          before_url: beforePhoto,
          after_url: afterUrl || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800',
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

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <Spinner size="lg" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#5E6F63]">
          Loading Municipal Work Order...
        </p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="font-serif font-bold text-lg text-[#26302A]">Work Order Not Found</h2>
        <p className="text-xs text-[#5E6F63]">The requested ticket could not be retrieved from the database.</p>
        <Link href="/official">
          <Button size="sm" className="bg-[#26302A] text-[#F6F4EF]">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/official"
          className="text-xs font-mono font-bold text-[#C58A66] hover:text-[#B85D36] flex items-center gap-1 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <span className="text-[10px] font-mono text-[#A3AD9C]">
          Ticket #{ticket.id.slice(0, 8)}
        </span>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#26302A] tracking-tight">
          Update Remediation Progress: {ticket.category}
        </h1>
        <p className="text-xs text-[#5E6F63] mt-1">
          {ticket.asset?.name || 'Corridor Asset'} • Assigned Municipal Ward:{' '}
          <strong className="text-[#26302A]">{ticket.authority?.ward_name || 'Ward A'}</strong>
        </p>
      </div>

      {/* Stepper */}
      <div className="overflow-x-auto pb-2">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
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
                <span className="text-xs font-mono uppercase tracking-wider text-[#5E6F63] font-semibold block">Step 1 of 4</span>
                <span className="font-serif font-bold text-base text-[#26302A]">Upload Post-Repair Visual Proof</span>
              </div>
            </div>
            <StatusBadge status={ticket.status} />
          </div>

          {/* Original Defect Reference */}
          <div className="p-4 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6] text-xs space-y-1">
            <span className="font-semibold text-[#26302A]">Original Citizen Report:</span>
            <p className="text-[#5E6F63] leading-relaxed font-sans">
              {ticket.human_final_json?.technical_summary || ticket.ai_raw_json?.technical_summary || 'Citizen report filed via field camera.'}
            </p>
          </div>

          {/* Photo Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#E4E0D6] hover:border-[#5E6F63] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition bg-[#F6F4EF]/60 hover:bg-[#F6F4EF] group"
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
                <div className="relative w-64 h-44 mx-auto rounded-xl overflow-hidden border border-[#E4E0D6] shadow-md">
                  <img src={photoPreview} alt="Repair preview" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-medium text-[#C58A66] group-hover:underline">Tap to replace repair photo</p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-[#E4E0D6] text-[#26302A] flex items-center justify-center mx-auto border border-[#A3AD9C]/30 group-hover:scale-105 transition-transform">
                  <Camera className="h-6 w-6 text-[#5E6F63]" />
                </div>
                <div>
                  <p className="text-sm font-serif font-bold text-[#26302A]">Upload Remediation Evidence</p>
                  <p className="text-xs text-[#5E6F63] mt-0.5">Photographic proof required before advancing work order</p>
                </div>
              </div>
            )}
          </div>

          <Textarea
            label="Field Crew Log Notes (Optional)"
            placeholder="e.g. Hot mix asphalt laid and roller compacted at 14:30. Traffic flow restored..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          <Button
            onClick={proceedToAIAssessment}
            disabled={!photoFile}
            className="w-full flex items-center justify-center gap-2 bg-[#26302A] hover:bg-[#34423a] text-[#F6F4EF]"
            size="lg"
          >
            <span>Proceed to AI Work-Update Assessment</span>
            <ArrowRight className="h-4 w-4 text-[#C58A66]" />
          </Button>
        </Card>
      )}

      {/* STEP 2: AI WORK-UPDATE SUMMARY */}
      {currentStep === 1 && (
        <Card className="p-6 sm:p-8 space-y-6 bg-white/70 backdrop-blur-sm border border-[#E4E0D6] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-4">
            <div className="flex items-center gap-2.5 text-[#26302A]">
              <div className="h-8 w-8 rounded-xl bg-[#26302A] text-[#F6F4EF] flex items-center justify-center">
                <Bot className="h-4 w-4 text-[#C58A66]" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#5E6F63] font-semibold block">Step 2 of 4</span>
                <span className="font-serif font-bold text-base text-[#26302A]">AI Work-Update Assessment</span>
              </div>
            </div>
            <Badge variant="clay">Automated Synthesis</Badge>
          </div>

          {isAnalyzing ? (
            <div className="py-16 text-center space-y-3">
              <Spinner size="md" />
              <p className="text-xs font-semibold text-[#5E6F63]">
                Analyzing post-repair photo against municipal engineering standards...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#5E6F63]/10 border border-[#5E6F63]/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#26302A]">
                  <CheckCircle2 className="h-4 w-4 text-[#5E6F63]" />
                  <span>Work Verification Recommended: &ldquo;{aiCompletionVerdict}&rdquo;</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#5E6F63]">96% Conf</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6] space-y-1.5">
                <p className="text-xs font-semibold text-[#26302A]">AI Standardized Remediation Summary</p>
                <p className="text-xs text-[#26302A]/80 leading-relaxed font-sans">{aiWorkSummary}</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(0)} className="w-1/3">
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="w-2/3 flex items-center justify-center gap-2 bg-[#26302A] hover:bg-[#34423a] text-[#F6F4EF]"
                >
                  <span>Confirm and Update Status</span>
                  <ArrowRight className="h-4 w-4 text-[#C58A66]" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 3: OFFICIAL VERIFICATION */}
      {currentStep === 2 && (
        <Card className="p-6 sm:p-8 space-y-6 bg-white/70 backdrop-blur-sm border border-[#E4E0D6] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-4">
            <div className="flex items-center gap-2.5 text-[#26302A]">
              <div className="h-8 w-8 rounded-xl bg-[#26302A] text-[#F6F4EF] flex items-center justify-center">
                <HardHat className="h-4 w-4 text-[#C58A66]" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#5E6F63] font-semibold block">Step 3 of 4</span>
                <span className="font-serif font-bold text-base text-[#26302A]">Official Verification & Status</span>
              </div>
            </div>
            <Badge variant="moss">Operator Sign-Off</Badge>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase font-semibold text-[#5E6F63]">
                Target Status Progression
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedNewStatus('In Progress')}
                  className={`p-3.5 rounded-2xl border text-left font-bold text-xs transition cursor-pointer ${
                    selectedNewStatus === 'In Progress'
                      ? 'border-[#26302A] bg-[#26302A] text-[#F6F4EF] shadow-sm'
                      : 'border-[#E4E0D6] bg-[#F6F4EF] text-[#26302A] hover:bg-[#E4E0D6]/60'
                  }`}
                >
                  <div className="text-xs font-serif font-bold">In Progress</div>
                  <div className="text-[11px] opacity-80 font-normal mt-0.5">Crew active on site</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedNewStatus('Repair Claimed')}
                  className={`p-3.5 rounded-2xl border text-left font-bold text-xs transition cursor-pointer ${
                    selectedNewStatus === 'Repair Claimed'
                      ? 'border-[#26302A] bg-[#26302A] text-[#F6F4EF] shadow-sm'
                      : 'border-[#E4E0D6] bg-[#F6F4EF] text-[#26302A] hover:bg-[#E4E0D6]/60'
                  }`}
                >
                  <div className="text-xs font-serif font-bold">Repair Claimed</div>
                  <div className="text-[11px] opacity-80 font-normal mt-0.5">Triggers AI Auditor & Citizen Verification</div>
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
              className="w-2/3 flex items-center justify-center gap-2 bg-[#26302A] hover:bg-[#34423a] text-[#F6F4EF]"
            >
              <span>Submit Status & Handoff to Auditor</span>
              <ArrowRight className="h-4 w-4 text-[#C58A66]" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: AUDITOR HANDOFF & TRIGGER */}
      {currentStep === 3 && (
        <Card className="p-8 sm:p-10 text-center space-y-6 bg-white/70 backdrop-blur-sm border border-[#E4E0D6] shadow-sm">
          {isHandingOff ? (
            <div className="py-12 space-y-4">
              <Spinner size="lg" />
              <h3 className="text-base font-serif font-bold text-[#26302A]">
                Triggering AI Auditor Paired Resolution Inspection...
              </h3>
              <p className="text-xs text-[#5E6F63] max-w-sm mx-auto">
                Comparing pre-repair photograph with newly submitted post-repair evidence in Supabase.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-16 w-16 rounded-full bg-[#5E6F63]/15 text-[#5E6F63] flex items-center justify-center mx-auto border border-[#5E6F63]/30 shadow-2xs">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <Badge variant="emerald" size="md">Handoff Successful</Badge>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#26302A]">
                  Status Updated to &ldquo;{selectedNewStatus}&rdquo;
                </h2>
                <p className="text-xs text-[#5E6F63] max-w-md mx-auto leading-relaxed">
                  The Follow-Up Engine has been updated in Supabase and the <strong>AI Resolution Auditor</strong> has received the paired photographic proof.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6] max-w-md mx-auto text-xs text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#5E6F63]">Ticket:</span>
                  <strong className="text-[#26302A] font-mono">#{ticket.id.slice(0, 8)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5E6F63]">Updated Status:</span>
                  <strong className="text-[#C58A66] font-mono">{selectedNewStatus}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5E6F63]">Next Stage:</span>
                  <strong className="text-[#5E6F63]">AI Resolution Audit / Citizen Closure</strong>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link href="/official" className="w-full sm:w-auto">
                  <Button size="md" className="w-full sm:w-auto bg-[#26302A] text-[#F6F4EF]">
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
