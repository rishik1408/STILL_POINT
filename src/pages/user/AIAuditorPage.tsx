import { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner } from '@/components/ui/shared';
import { fetchIssues } from '@/lib/data-service';
import { auditRepairPair } from '@/lib/ai-service';
import { Issue, AuditVerdict } from '@/types';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export function AIAuditorPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    verdict: AuditVerdict;
    confidence: number;
    reasoning: string;
    recommendations: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchIssues();
        setIssues(data);
        if (data.length > 0) {
          // Select an issue with claimed or verified repairs
          const claimed = data.find((i) => i.status === 'Repair Claimed' || i.status === 'Verified Closed') || data[0];
          setSelectedIssue(claimed);
        }
      } catch (err) {
        console.error('Failed to load issues for audit:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleRunAudit = async () => {
    if (!selectedIssue) return;
    setAuditing(true);
    try {
      const beforeUrl =
        selectedIssue.media?.find((m) => m.stage === 'before')?.file_url ||
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800';
      const afterUrl =
        selectedIssue.media?.find((m) => m.stage === 'after')?.file_url ||
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800';

      const res = await auditRepairPair(beforeUrl, afterUrl, selectedIssue.category);
      setAuditResult(res);
    } catch (err) {
      console.error('Audit run failed:', err);
    } finally {
      setAuditing(false);
    }
  };

  const beforePhoto =
    selectedIssue?.media?.find((m) => m.stage === 'before')?.file_url ||
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80';

  const afterPhoto =
    selectedIssue?.media?.find((m) => m.stage === 'after')?.file_url ||
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#EDE9E0] p-6 rounded-2xl border border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#26302A]">
            AI Repair Auditor & Closed-Loop Verification
          </h1>
          <p className="text-sm text-[#5E6F63] mt-1">
            Paired before-and-after photographic verification ensuring contractors fulfill municipal repair standards.
          </p>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issue Selector Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E6F63] px-1">
              Select Repair Claim to Audit
            </h3>
            <div className="space-y-2">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => {
                    setSelectedIssue(issue);
                    setAuditResult(null);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedIssue?.id === issue.id
                      ? 'bg-[#EDE9E0] border-[#26302A] shadow-sm'
                      : 'bg-[#F6F4EF] border-[#E4E0D6] hover:bg-[#EDE9E0]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-[#5E6F63]">
                      STP-{issue.id.slice(0, 6).toUpperCase()}
                    </span>
                    <Badge variant={issue.status === 'Verified Closed' ? 'moss' : 'amber'}>
                      {issue.status}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-[#26302A] line-clamp-1">
                    {issue.category} — {issue.asset?.name || 'Arterial Corridor'}
                  </h4>
                  <p className="text-xs text-[#5E6F63] line-clamp-2 mt-1">
                    {issue.human_final_json?.description || issue.ai_raw_json?.description || 'Structural repair claim submitted.'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Side-by-Side Audit Arena */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E4E0D6]">
                <div>
                  <span className="text-xs font-bold text-[#5E6F63] uppercase tracking-wider">
                    Paired Photo Evaluation
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#26302A] mt-0.5">
                    {selectedIssue?.category} — {selectedIssue?.asset?.name || 'Ward Asset'}
                  </h3>
                </div>
                <Button
                  variant="clay"
                  size="sm"
                  loading={auditing}
                  onClick={handleRunAudit}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Execute AI Audit</span>
                </Button>
              </div>

              {/* Photos Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#26302A]">1. Before Repair (Initial Report)</span>
                    <span className="text-[#A84835] font-semibold">Defect Active</span>
                  </div>
                  <div className="h-64 rounded-xl overflow-hidden border border-[#E4E0D6] bg-black/5">
                    <img
                      src={beforePhoto}
                      alt="Before Repair"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#26302A]">2. After Repair (Contractor Proof)</span>
                    <span className="text-[#15803D] font-semibold">Restored</span>
                  </div>
                  <div className="h-64 rounded-xl overflow-hidden border border-[#E4E0D6] bg-black/5">
                    <img
                      src={afterPhoto}
                      alt="After Repair"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Audit Result Display */}
              {auditResult && (
                <div className="p-6 rounded-2xl bg-[#EDE9E0] border border-[#E4E0D6] space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {auditResult.verdict === 'Resolved' ? (
                        <CheckCircle2 className="w-6 h-6 text-[#15803D]" />
                      ) : auditResult.verdict === 'Partially Patched' ? (
                        <AlertTriangle className="w-6 h-6 text-[#C58A66]" />
                      ) : (
                        <XCircle className="w-6 h-6 text-[#A84835]" />
                      )}
                      <div>
                        <span className="text-xs uppercase font-bold tracking-wider text-[#5E6F63]">
                          Audit Verdict
                        </span>
                        <h4 className="text-xl font-serif font-bold text-[#26302A]">
                          {auditResult.verdict}
                        </h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs uppercase font-bold tracking-wider text-[#5E6F63]">
                        Confidence
                      </span>
                      <p className="text-lg font-bold text-[#5E6F63]">
                        {(auditResult.confidence * 100).toFixed(0)}% Rigor
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#E4E0D6]">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#26302A]">
                      Engineering Audit Rationale
                    </h5>
                    <p className="text-sm text-[#26302A] leading-relaxed">
                      {auditResult.reasoning}
                    </p>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-[#E4E0D6]">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#26302A]">
                      Closure Recommendation
                    </h5>
                    <p className="text-xs text-[#5E6F63] leading-relaxed">
                      {auditResult.recommendations}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
