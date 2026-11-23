'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Bot,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { Button, Card, Badge, SeverityBadge, StatusBadge, Spinner, EmptyState } from '@/components/ui/shared';
import { fetchIssues, updateIssueStatus } from '@/lib/data-service';
import { Issue, AuditVerdict } from '@/types';
import { formatDate, getSLAStatus } from '@/lib/utils';
import { StillPointLogo } from '@/components/ui/StillPointLogo';

export default function UserAuditorPage() {
  const [activeTab, setActiveTab] = useState<'auditor' | 'followup'>('auditor');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditingIssueId, setAuditingIssueId] = useState<string | null>(null);
  const [auditResults, setAuditResults] = useState<
    Record<
      string,
      {
        verdict: AuditVerdict;
        confidence: number;
        reasoning: string;
        requires_human_review?: boolean;
      }
    >
  >({});

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchIssues();
        if (isMounted) {
          setIssues(data);
        }
      } catch (err) {
        console.error('Failed to load auditor issues:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter issues for "Pending Verification" (Repair Claimed)
  const pendingAuditIssues = issues.filter(
    (i) => i.status === 'Repair Claimed' || i.status === 'Verified Closed'
  );

  // Issues tracked by Follow-Up Engine (Reported, In Progress, Escalated)
  const trackedIssues = issues.filter(
    (i) => i.status === 'Reported' || i.status === 'In Progress' || i.status === 'Escalated'
  );

  const triggerAudit = async (issue: Issue) => {
    setAuditingIssueId(issue.id);

    try {
      const beforeUrl =
        issue.media?.find((m) => m.stage === 'before')?.file_url ||
        'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800';
      const afterUrl =
        issue.media?.find((m) => m.stage === 'after')?.file_url ||
        'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800';

      const res = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          before_url: beforeUrl,
          after_url: afterUrl,
          issue_id: issue.id,
        }),
      });

      const data = await res.json();
      setAuditResults((prev) => ({
        ...prev,
        [issue.id]: data,
      }));

      // If resolved with high confidence, update database to 'Verified Closed'
      if (data.verdict === 'Resolved' && !data.requires_human_review) {
        await updateIssueStatus(
          issue.id,
          'Verified Closed',
          data.reasoning || 'Automated paired visual inspection verified structural remediation.',
          data.verdict,
          data.confidence
        );

        setIssues((prev) =>
          prev.map((item) =>
            item.id === issue.id ? { ...item, status: 'Verified Closed' } : item
          )
        );
      }
    } catch (err) {
      console.error('Audit run error:', err);
    } finally {
      setAuditingIssueId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#5E6F63] font-semibold">
              Quality Assurance
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C58A66]" />
            <span className="text-[10px] font-mono uppercase text-[#A3AD9C]">Automated Inspection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#26302A] tracking-tight">
            AI Resolution Auditor & SLA Engine
          </h1>
          <p className="text-xs text-[#5E6F63] mt-1 max-w-xl">
            Objective before-and-after photo resolution audits and automated SLA grievance escalation tracking.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-2xl bg-[#E4E0D6]/60 p-1 border border-[#E4E0D6]">
          <button
            onClick={() => setActiveTab('auditor')}
            className={`py-2 px-3.5 rounded-xl text-xs font-serif font-bold transition cursor-pointer ${
              activeTab === 'auditor'
                ? 'bg-[#26302A] text-[#F6F4EF] shadow-2xs'
                : 'text-[#5E6F63] hover:text-[#26302A]'
            }`}
          >
            Resolution Auditor ({pendingAuditIssues.length})
          </button>
          <button
            onClick={() => setActiveTab('followup')}
            className={`py-2 px-3.5 rounded-xl text-xs font-serif font-bold transition cursor-pointer ${
              activeTab === 'followup'
                ? 'bg-[#26302A] text-[#F6F4EF] shadow-2xs'
                : 'text-[#5E6F63] hover:text-[#26302A]'
            }`}
          >
            SLA Follow-Up Tracker ({trackedIssues.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#5E6F63]">
            Loading Verification Queues...
          </p>
        </div>
      ) : null}

      {/* TAB 1: AI AUDITOR */}
      {!loading && activeTab === 'auditor' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#E4E0D6] text-xs text-[#26302A] flex items-start gap-3.5 shadow-2xs">
            <div className="p-2 rounded-xl bg-[#5E6F63]/10 text-[#5E6F63] shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="font-serif font-bold text-sm text-[#26302A]">Multimodal Visual Remediation Rubric</p>
              <p className="text-[#5E6F63] mt-0.5 leading-relaxed">
                Repairs claimed by municipal crews undergo automated paired image comparison. Confidence &ge; 85% with complete restoration transitions to <strong>Verified Closed</strong>; sub-threshold or partial patches are flagged for Senior Inspector review.
              </p>
            </div>
          </div>

          {pendingAuditIssues.length === 0 ? (
            <Card className="p-12 text-center bg-white/70 backdrop-blur-sm border border-[#E4E0D6] shadow-sm space-y-3">
              <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6]">
                <CheckCircle2 className="h-7 w-7 text-[#5E6F63]" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#26302A]">No Audits Awaiting Verification</h3>
              <p className="text-xs text-[#5E6F63] max-w-sm mx-auto">
                No tickets currently reside in &ldquo;Repair Claimed&rdquo; state. Once municipal crews upload proof of repair, they populate this queue.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingAuditIssues.map((issue) => {
                const audit = auditResults[issue.id];
                const isRunning = auditingIssueId === issue.id;
                const beforePhoto = issue.media?.find((m) => m.stage === 'before')?.file_url;
                const afterPhoto = issue.media?.find((m) => m.stage === 'after')?.file_url;

                return (
                  <Card key={issue.id} className="p-5 sm:p-6 space-y-5 border border-[#E4E0D6] bg-white/80 backdrop-blur-xs shadow-2xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#E4E0D6] pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-[#A3AD9C]">
                            #{issue.id.slice(0, 8)}
                          </span>
                          <SeverityBadge severity={issue.severity} />
                          <StatusBadge status={issue.status} />
                        </div>
                        <h3 className="text-base font-serif font-bold text-[#26302A]">
                          {issue.category} — {issue.asset?.name || 'Corridor Asset'}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-mono text-[#5E6F63] block">Intake Date:</span>
                        <strong className="text-xs font-mono text-[#26302A]">{formatDate(issue.created_at)}</strong>
                      </div>
                    </div>

                    {/* Paired Photo Comparison */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Before Photo */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-[#26302A] uppercase tracking-wider text-[10px]">
                            1. Citizen Capture (Before)
                          </span>
                          <span className="text-[#A3AD9C] text-[10px] font-mono">Original Defect</span>
                        </div>
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-[#F6F4EF] border border-[#E4E0D6]">
                          {beforePhoto ? (
                            <img src={beforePhoto} alt="Before remediation" className="w-full h-full object-cover" />
                          ) : (
                            <div className="h-full flex items-center justify-center text-xs text-[#A3AD9C] font-mono">
                              No before image attached
                            </div>
                          )}
                        </div>
                      </div>

                      {/* After Photo */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-[#5E6F63] uppercase tracking-wider text-[10px]">
                            2. Ward Remediation (After)
                          </span>
                          <span className="text-[#5E6F63] text-[10px] font-mono font-semibold">Crew Evidence</span>
                        </div>
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-[#F6F4EF] border border-[#5E6F63]/30 ring-2 ring-[#5E6F63]/10">
                          {afterPhoto ? (
                            <img src={afterPhoto} alt="After remediation" className="w-full h-full object-cover" />
                          ) : (
                            <div className="h-full flex items-center justify-center text-xs text-[#A3AD9C] font-mono">
                              Awaiting official remediation photo
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Audit Result Display */}
                    {audit && (
                      <div
                        className={`p-4 rounded-xl border space-y-2 ${
                          audit.verdict === 'Resolved'
                            ? 'bg-[#5E6F63]/10 border-[#5E6F63]/30 text-[#26302A]'
                            : audit.verdict === 'Partially Patched'
                            ? 'bg-[#C58A66]/15 border-[#C58A66]/40 text-[#26302A]'
                            : 'bg-[#A84835]/15 border-[#A84835]/40 text-[#26302A]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {audit.verdict === 'Resolved' && <CheckCircle2 className="h-4 w-4 text-[#5E6F63]" />}
                            {audit.verdict === 'Partially Patched' && <AlertTriangle className="h-4 w-4 text-[#C58A66]" />}
                            {audit.verdict === 'Unresolved' && <XCircle className="h-4 w-4 text-[#A84835]" />}
                            <strong className="text-sm font-serif font-bold">
                              AI Verdict: {audit.verdict}
                            </strong>
                          </div>
                          <span className="text-xs font-mono font-bold text-[#5E6F63]">
                            Confidence: {((audit.confidence || 0.95) * 100).toFixed(0)}%
                          </span>
                        </div>

                        <p className="text-xs leading-relaxed font-sans">{audit.reasoning}</p>

                        {audit.requires_human_review && (
                          <div className="pt-2 border-t border-[#E4E0D6] text-xs text-[#C58A66] font-semibold flex items-center gap-1.5 font-mono">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Flagged: Sub-threshold confidence (&lt;85%) routed to Senior Engineer Review Desk</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Trigger Action */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-[#5E6F63]">
                        Authority: <strong className="text-[#26302A]">{issue.authority?.ward_name || 'Central Ward'}</strong>
                      </span>

                      {issue.status === 'Repair Claimed' && !audit && (
                        <Button
                          onClick={() => triggerAudit(issue)}
                          loading={isRunning}
                          size="sm"
                          className="flex items-center gap-2 bg-[#26302A] text-[#F6F4EF] hover:bg-[#34423a]"
                        >
                          <Bot className="h-4 w-4 text-[#C58A66]" />
                          <span>Run Paired AI Audit</span>
                        </Button>
                      )}

                      {issue.status === 'Verified Closed' && (
                        <Badge variant="emerald" size="md">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Verified Closed & Sealed
                        </Badge>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SLA FOLLOW-UP TRACKER */}
      {!loading && activeTab === 'followup' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#E4E0D6] text-xs text-[#26302A] flex items-start gap-3.5 shadow-2xs">
            <div className="p-2 rounded-xl bg-[#C58A66]/15 text-[#C58A66] shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="font-serif font-bold text-sm text-[#26302A]">Municipal Resolution SLA Tracker</p>
              <p className="text-[#5E6F63] mt-0.5 leading-relaxed">
                Every ticket is bound to a strict municipal Service Level Agreement (SLA): <strong>14 days for Critical / High (S3/S4)</strong> and <strong>30 days for Medium / Low (S1/S2)</strong>. Tickets exceeding deadlines auto-escalate with weekly executive briefs sent to the Municipal Commissioner.
              </p>
            </div>
          </div>

          {trackedIssues.length === 0 ? (
            <Card className="p-12 text-center bg-white/70 backdrop-blur-sm border border-[#E4E0D6] shadow-sm space-y-3">
              <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6]">
                <ShieldCheck className="h-7 w-7 text-[#5E6F63]" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#26302A]">No Active SLA Grievances</h3>
              <p className="text-xs text-[#5E6F63] max-w-sm mx-auto">
                All reported tickets have been remediated or verified closed.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {trackedIssues.map((issue) => {
                const slaInfo = getSLAStatus(issue.sla_due_at);

                return (
                  <Card key={issue.id} className="p-5 border border-[#E4E0D6] bg-white/80 backdrop-blur-xs shadow-2xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-[#A3AD9C]">
                            #{issue.id.slice(0, 8)}
                          </span>
                          <SeverityBadge severity={issue.severity} />
                          <StatusBadge status={issue.status} />
                          {issue.escalation_count > 0 && (
                            <Badge variant="red" size="sm">
                              Escalated ×{issue.escalation_count}
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-serif font-bold text-[#26302A]">
                          {issue.category} — {issue.asset?.name || 'Corridor Asset'}
                        </h3>

                        <p className="text-xs text-[#5E6F63]">
                          Assigned: <strong className="text-[#26302A]">{issue.authority?.contact_name || 'Ward Engineer'}</strong> ({issue.authority?.ward_name || 'Jurisdiction'})
                        </p>
                      </div>

                      {/* SLA countdown badge */}
                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase text-[#A3AD9C] block">SLA Expiry Target</span>
                        <strong className={`text-xs font-mono ${slaInfo.isBreached ? 'text-[#A84835] font-bold' : 'text-[#26302A]'}`}>
                          {formatDate(issue.sla_due_at || '')} ({slaInfo.label})
                        </strong>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
