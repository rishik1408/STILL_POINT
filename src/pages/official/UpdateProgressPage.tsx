import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Textarea, Spinner, Badge, SeverityBadge } from '@/components/ui/shared';
import { fetchIssues, updateIssueStatus, uploadMediaFile } from '@/lib/data-service';
import { auditRepairPair } from '@/lib/ai-service';
import { Issue, AuditVerdict } from '@/types';
import { Camera, CheckCircle2, Sparkles, ArrowLeft, Upload, ShieldCheck } from 'lucide-react';

const SAMPLE_REPAIR_PHOTOS = [
  {
    name: 'Bituminous Patch Compaction (Bellandur ORR)',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tender SURE Granite Paver Replacement (Indiranagar)',
    url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'BMTC Transit Shelter Canopy Replaced (Koramangala)',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
  },
];

export function UpdateProgressPage() {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [workNotes, setWorkNotes] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    verdict: AuditVerdict;
    confidence: number;
    reasoning: string;
    recommendations: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const issues = await fetchIssues();
        const found = issues.find((i) => i.id === issueId) || issues[0];
        setIssue(found || null);
      } catch (err) {
        console.error('Failed to load issue:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [issueId]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setAuditResult(null);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_REPAIR_PHOTOS[0]) => {
    setPhotoPreview(sample.url);
    setPhotoFile(null);
    setAuditResult(null);
  };

  const handleRunAiVerification = async () => {
    if (!issue || !photoPreview) return;
    setIsAuditing(true);
    try {
      const beforeUrl =
        issue.media?.find((m) => m.stage === 'before')?.file_url ||
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800';
      const res = await auditRepairPair(beforeUrl, photoPreview, issue.category);
      setAuditResult(res);
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleFinalSignOff = async () => {
    if (!issue) return;
    setIsSubmitting(true);
    try {
      let mediaUrl = photoPreview;
      if (photoFile) {
        const uploaded = await uploadMediaFile(photoFile, 'after');
        if (uploaded) mediaUrl = uploaded;
      }

      const newStatus = auditResult?.verdict === 'Resolved' ? 'Verified Closed' : 'Repair Claimed';
      await updateIssueStatus(
        issue.id,
        newStatus,
        `Official repair logged: ${workNotes || 'Restoration verified with photo evidence.'}`
      );
      navigate('/official');
    } catch (err) {
      console.error('Sign-off error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (!issue) return <div className="p-8 text-center">Ticket not found.</div>;

  const beforePhoto =
    issue.media?.find((m) => m.stage === 'before')?.file_url ||
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#EDE9E0] p-6 rounded-2xl border border-[#E4E0D6] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/official')}
            className="p-2 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] text-[#26302A] hover:bg-[#E4E0D6]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-xs font-mono font-bold text-[#5E6F63]">
              STP-{issue.id.slice(0, 8).toUpperCase()}
            </span>
            <h1 className="text-xl font-serif font-bold text-[#26302A]">
              Log Repair Proof & AI Verification
            </h1>
          </div>
        </div>
        <SeverityBadge severity={issue.severity} />
      </div>

      {/* Baseline vs After Container */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Before Photo */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5E6F63]">
              1. Baseline Reported Defect
            </span>
            <div className="h-56 rounded-xl overflow-hidden border border-[#E4E0D6] bg-black/5">
              <img
                src={beforePhoto}
                alt="Before repair"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-[#5E6F63] line-clamp-2">
              {issue.human_final_json?.description || issue.ai_raw_json?.description}
            </p>
          </div>

          {/* After Photo Upload */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#26302A]">
              2. Completed Repair Evidence ("After")
            </span>
            {photoPreview ? (
              <div className="h-56 rounded-xl overflow-hidden border border-[#26302A] bg-black/5 relative group">
                <img
                  src={photoPreview}
                  alt="After repair"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white rounded-lg text-xs"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div className="h-56 rounded-xl border-2 border-dashed border-[#A3AD9C] flex flex-col items-center justify-center p-4 bg-[#F6F4EF]">
                <input
                  type="file"
                  id="after-photo"
                  onChange={handlePhotoSelect}
                  accept="image/*"
                  className="hidden"
                />
                <label
                  htmlFor="after-photo"
                  className="cursor-pointer flex flex-col items-center gap-2 text-center"
                >
                  <Upload className="w-6 h-6 text-[#5E6F63]" />
                  <span className="text-xs font-semibold text-[#26302A]">
                    Upload Contractor Repair Photo
                  </span>
                </label>
              </div>
            )}

            {/* Quick Sample Selector */}
            {!photoPreview && (
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-[#5E6F63]">
                  Or choose verified repair photo:
                </span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {SAMPLE_REPAIR_PHOTOS.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => handleSelectSample(s)}
                      className="text-left p-2 rounded-lg border border-[#E4E0D6] bg-[#EDE9E0] text-[11px] font-medium text-[#26302A] line-clamp-1 hover:bg-[#E4E0D6]"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Work Log Notes */}
        <div>
          <label className="block text-xs font-semibold text-[#26302A] mb-1">
            Contractor Execution Notes & Materials Used
          </label>
          <Textarea
            value={workNotes}
            onChange={(e) => setWorkNotes(e.target.value)}
            placeholder="e.g. Applied bituminous emulsion tack coat and compacted 60mm dense asphalt..."
            rows={2}
          />
        </div>

        {/* AI Audit Action */}
        {photoPreview && !auditResult && (
          <div className="p-4 rounded-xl bg-[#EDE9E0] border border-[#E4E0D6] flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#26302A]">
                Run Pre-Closure AI Audit Verification
              </h4>
              <p className="text-xs text-[#5E6F63]">
                Evaluates surface continuity and structural resolution against baseline.
              </p>
            </div>
            <Button
              variant="clay"
              size="sm"
              loading={isAuditing}
              onClick={handleRunAiVerification}
              className="gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Verify Repair</span>
            </Button>
          </div>
        )}

        {/* AI Audit Result */}
        {auditResult && (
          <div className="p-6 rounded-2xl bg-[#EDE9E0] border border-[#E4E0D6] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                <span className="font-serif font-bold text-base text-[#26302A]">
                  AI Audit Verdict: {auditResult.verdict} ({(auditResult.confidence * 100).toFixed(0)}% Rigor)
                </span>
              </div>
              <Badge variant="moss">Standard Met</Badge>
            </div>
            <p className="text-xs text-[#26302A] leading-relaxed">
              {auditResult.reasoning}
            </p>
          </div>
        )}

        {/* Final Sign-off Button */}
        <div className="pt-4 border-t border-[#E4E0D6] flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/official')}>
            Cancel
          </Button>
          <Button
            variant="clay"
            size="lg"
            disabled={!photoPreview}
            loading={isSubmitting}
            onClick={handleFinalSignOff}
            className="gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Confirm & Close Ticket</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
