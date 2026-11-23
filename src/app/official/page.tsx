'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  HardHat,
  ArrowRight,
  Filter,
  Search,
  MapPin,
  Eye,
  Building2,
  FileEdit,
  Flame,
} from 'lucide-react';
import {
  StatCard,
  Card,
  Badge,
  Button,
  SeverityBadge,
  StatusBadge,
} from '@/components/ui/shared';
import { MOCK_ISSUES, MOCK_AUTHORITIES } from '@/lib/mock-data';
import { formatDate, getSLAStatus } from '@/lib/utils';
import { Issue } from '@/types';

export default function OfficialDashboardPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const ward = MOCK_AUTHORITIES[0];

  // Prioritize tickets: severity desc, then SLA urgency
  const sortedTickets = [...MOCK_ISSUES].sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const filteredTickets = sortedTickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (severityFilter !== 'all' && t.severity.toString() !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.category.toLowerCase().includes(q) ||
        t.asset?.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate KPIs
  const openCount = MOCK_ISSUES.filter((i) => i.status !== 'Verified Closed').length;
  const slaBreachCount = MOCK_ISSUES.filter(
    (i) => getSLAStatus(i.sla_due_at).isBreached && i.status !== 'Verified Closed'
  ).length;
  const pendingAuditCount = MOCK_ISSUES.filter((i) => i.status === 'Repair Claimed').length;
  const verifiedClosedCount = MOCK_ISSUES.filter((i) => i.status === 'Verified Closed').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              {ward.ward_name}
            </span>
            <Badge variant="amber" size="sm">Operator Station</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Municipal Operator Command Center
          </h1>
          <p className="text-xs text-slate-500">
            Ward-scoped defect triage, emergency maintenance crew dispatch, and SLA compliance monitoring.
          </p>
        </div>

        <Link href="/official/map">
          <Button size="sm" className="flex items-center gap-2 bg-[#1B365D] hover:bg-[#152a4a]">
            <MapPin className="h-4 w-4 text-amber-400" />
            <span>Open Ward Dispatch Map</span>
          </Button>
        </Link>
      </div>

      {/* SLA Alert Banner if breaches exist */}
      {slaBreachCount > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 shadow-xs">
          <Flame className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-red-950">
              URGENT: {slaBreachCount} Ticket Exceeding Mandatory Municipal SLA Deadline
            </p>
            <p className="text-red-800 mt-0.5">
              Escalation notices have been batched and flagged to the Municipal Commissioner. Immediate field crew remediation is required.
            </p>
          </div>
        </div>
      )}

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Open Tickets"
          value={openCount}
          icon={<HardHat className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="SLA Breaches"
          value={slaBreachCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
        />
        <StatCard
          title="Pending AI Audits"
          value={pendingAuditCount}
          icon={<Clock className="h-5 w-5" />}
          color="amber"
        />
        <StatCard
          title="Verified Closed"
          value={verifiedClosedCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="emerald"
        />
      </div>

      {/* Prioritized Ward Ticket Queue */}
      <Card className="p-5 space-y-4 bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Prioritized Ward Work-Order Queue
            </h2>
            <p className="text-xs text-slate-500">
              Sorted by Severity (S4 Critical first) then SLA Urgency.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="In Progress">In Progress</option>
              <option value="Repair Claimed">Repair Claimed</option>
              <option value="Escalated">Escalated</option>
              <option value="Verified Closed">Verified Closed</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="4">S4 Critical</option>
              <option value="3">S3 High</option>
              <option value="2">S2 Medium</option>
              <option value="1">S1 Low</option>
            </select>
          </div>
        </div>

        {/* Tickets Table / Cards */}
        <div className="space-y-3 pt-2">
          {filteredTickets.map((ticket) => {
            const sla = getSLAStatus(ticket.sla_due_at);
            const isCritical = ticket.severity === 4;

            return (
              <div
                key={ticket.id}
                className={`p-4 rounded-xl border transition ${
                  isCritical && ticket.status !== 'Verified Closed'
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        #{ticket.id.slice(0, 8)}
                      </span>
                      <SeverityBadge severity={ticket.severity} />
                      <StatusBadge status={ticket.status} />
                      {sla.isBreached && ticket.status !== 'Verified Closed' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 animate-pulse">
                          SLA Overdue
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      {ticket.category} — {ticket.asset?.name}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-1">
                      {ticket.human_final_json?.technical_summary || ticket.ai_raw_json?.technical_summary}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-0.5">
                      <span>Reported: {formatDate(ticket.created_at)}</span>
                      <span>•</span>
                      <span className={sla.isBreached ? 'text-red-600 font-bold' : 'text-slate-600'}>
                        SLA Target: {sla.label}
                      </span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2.5 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                    <Link href={`/official/update/${ticket.id}`}>
                      <Button
                        size="sm"
                        className="flex items-center gap-1.5 text-xs py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700"
                      >
                        <FileEdit className="h-3.5 w-3.5" />
                        <span>Update Progress</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
