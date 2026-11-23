'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Bot,
  ArrowRight,
  ShieldAlert,
  Send,
  Building2,
} from 'lucide-react';
import { Button, Card, Badge, SeverityBadge, StatusBadge, Spinner } from '@/components/ui/shared';
import { MOCK_ISSUES } from '@/lib/mock-data';
import { Issue, AuditVerdict } from '@/types';
import { formatDate, getSLAStatus } from '@/lib/utils';

export default function UserAuditorPage() {
  const [activeTab, setActiveTab] = useState<'auditor' | 'followup'>('auditor');
  const [issues, setIssues] = useState<Issue[]>(MOCK_ISSUES);
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
  >({
    // Pre-seed an audit result for closed issue #5
    'c5000000-0000-0000-0000-000000000005': {
      verdict: 'Resolved',
      confidence: 0.98,
      reasoning: 'Paired image comparison verifies complete structural remediation. Both LED fixtures restored and illumination certified.',
      requires_human_review: false,
    },
  });

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

      // If resolved with high confidence, update local state to 'Verified Closed'
      if (data.verdict === 'Resolved' && !data.requires_human_review) {
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1B365D] tracking-tight">
            AI Auditor & Follow-Up Engine
          </h1>
          <p className="text-xs text-slate-500">
            Objective before-and-after photo resolution audits and automated SLA grievance escalation tracking.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-slate-200/80 p-1 border border-slate-300/50">
          <button
            onClick={() => setActiveTab('auditor')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'auditor' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resolution Auditor ({pendingAuditIssues.length})
          </button>
          <button
            onClick={() => setActiveTab('followup')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'followup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SLA Follow-Up Tracker ({trackedIssues.length})
          </button>
        </div>
      </div>

      {/* TAB 1: AI AUDITOR */}
      {activeTab === 'auditor' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Multimodal Before-and-After Verification Rubric</p>
              <p className="text-blue-700 mt-0.5">
                Repairs marked by crews as &ldquo;Repair Claimed&rdquo; must pass automated paired visual scrutiny. Confidence scores &lt; 0.85 or &ldquo;Partially Patched&rdquo; flags route to Human Review; &ldquo;Unresolved&rdquo; re-opens the ticket with escalation.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {pendingAuditIssues.map((issue) => {
              const audit = auditResults[issue.id];
              const isRunning = auditingIssueId === issue.id;
              const beforePhoto = issue.media?.find((m) => m.stage === 'before')?.file_url;
              const afterPhoto = issue.media?.find((m) => m.stage === 'after')?.file_url;

              return (
                <Card key={issue.id} className="p-5 sm:p-6 space-y-5 border border-slate-200 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{issue.id.slice(0, 8)}
                        </span>
                        <SeverityBadge severity={issue.severity} />
                        <StatusBadge status={issue.status} />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {issue.category} — {issue.asset?.name}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block">Reported Date:</span>
                      <strong className="text-xs text-slate-800">{formatDate(issue.created_at)}</strong>
                    </div>
                  </div>

                  {/* Paired Photo Comparison Display */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Before Photo */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                          1. Original Defect (Before)
                        </span>
                        <span className="text-slate-400 text-[10px]">Citizen Capture</span>
                      </div>
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        {beforePhoto ? (
                          <img src={beforePhoto} alt="Before" className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-slate-400">No before photo</div>
                        )}
                      </div>
                    </div>

                    {/* After Photo */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-700 uppercase tracking-wider text-[11px]">
                          2. Completed Fix (After)
                        </span>
                        <span className="text-emerald-600 text-[10px] font-semibold">Field Crew Proof</span>
                      </div>
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-emerald-200 ring-2 ring-emerald-500/10">
                        {afterPhoto ? (
                          <img src={afterPhoto} alt="After" className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-slate-400">Awaiting after photo</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Audit Result Display */}
                  {audit && (
                    <div className={`p-4 rounded-xl border space-y-2 ${
                      audit.verdict === 'Resolved'
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : audit.verdict === 'Partially Patched'
                        ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                        : 'bg-red-50/70 border-red-200 text-red-950'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {audit.verdict === 'Resolved' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                          {audit.verdict === 'Partially Patched' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                          {audit.verdict === 'Unresolved' && <XCircle className="h-4 w-4 text-red-600" />}
                          <strong className="text-sm font-bold">
                            AI Verdict: {audit.verdict}
                          </strong>
                        </div>
                        <span className="text-xs font-mono font-bold">
                          Confidence: {((audit.confidence || 0.95) * 100).toFixed(0)}%
                        </span>
                      </div>

                      <p className="text-xs leading-relaxed">{audit.reasoning}</p>

                      {audit.requires_human_review && (
                        <div className="pt-2 border-t border-amber-200/60 text-xs text-amber-900 font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Flagged: Sub-threshold confidence (&lt;85%) routed to Senior Engineer Review Queue</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trigger Action */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500">
                      Mapped Ward: <strong>{issue.authority?.ward_name}</strong>
                    </span>

                    {issue.status === 'Repair Claimed' && !audit && (
                      <Button
                        onClick={() => triggerAudit(issue)}
                        loading={isRunning}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Bot className="h-4 w-4" />
                        <span>Run Paired AI Audit</span>
                      </Button>
                    )}

                    {issue.status === 'Verified Closed' && (
                      <Badge variant="emerald" size="md">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Verified & Closed
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SLA FOLLOW-UP TRACKER */}
      {activeTab === 'followup' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Automated Follow-Up & Escalation Engine</p>
              <p className="text-amber-800 mt-0.5">
                Every ticket is bound to a strict municipal Service Level Agreement (SLA): <strong>14 days for Critical/High (S3/S4)</strong> and <strong>30 days for Medium/Low (S1/S2)</strong>. Tickets exceeding deadlines auto-escalate with weekly executive briefs sent to the Municipal Commissioner.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {trackedIssues.map((issue) => {
              const slaInfo = getSLAStatus(issue.sla_due_at);

              return (
                <Card key={issue.id} className="p-5 border border-slate-200 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
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

                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {issue.category} — {issue.asset?.name}
                      </h3>

                      <p className="text-xs text-slate-500">
                        Assigned: <strong>{issue.authority?.contact_name}</strong> ({issue.authority?.ward_name})
                      </p>
                    </div>

                    {/* SLA countdown badge */}
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">SLA Expiry Target:</span>
                      <strong className={`text-xs ${slaInfo.isBreached ? 'text-red-600 font-bold' : 'text-slate-800'}`}>
                        {formatDate(issue.sla_due_at || '')} ({slaInfo.label})
                      </strong>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
