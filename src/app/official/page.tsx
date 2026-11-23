'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  HardHat,
  MapPin,
  FileEdit,
  Flame,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  StatCard,
  Card,
  Badge,
  Button,
  SeverityBadge,
  StatusBadge,
  Spinner,
} from '@/components/ui/shared';
import { fetchIssues, fetchAuthorities } from '@/lib/data-service';
import { formatDate, getSLAStatus } from '@/lib/utils';
import { Issue, Authority } from '@/types';
import { StillPointLogo } from '@/components/ui/StillPointLogo';

export default function OfficialDashboardPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadOfficialData() {
      try {
        setLoading(true);
        const [loadedIssues, loadedAuths] = await Promise.all([
          fetchIssues(),
          fetchAuthorities(),
        ]);
        if (isMounted) {
          setIssues(loadedIssues);
          setAuthorities(loadedAuths);
        }
      } catch (err) {
        console.error('Failed to load official dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadOfficialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const ward = authorities[0] || {
    id: 'ward-a',
    ward_name: 'Ward A — Colaba & Fort',
    department_name: 'Municipal Corporation Engineering Division',
  };

  // Prioritize tickets: severity desc, then SLA urgency
  const sortedTickets = useMemo(() => {
    return [...issues].sort((a, b) => {
      if (b.severity !== a.severity) return b.severity - a.severity;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [issues]);

  const filteredTickets = useMemo(() => {
    return sortedTickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (severityFilter !== 'all' && t.severity.toString() !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.category.toLowerCase().includes(q) ||
          t.asset?.name?.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sortedTickets, statusFilter, severityFilter, searchQuery]);

  // Calculate KPIs from real database issues
  const openCount = issues.filter((i) => i.status !== 'Verified Closed').length;
  const slaBreachCount = issues.filter(
    (i) => getSLAStatus(i.sla_due_at).isBreached && i.status !== 'Verified Closed'
  ).length;
  const pendingAuditCount = issues.filter((i) => i.status === 'Repair Claimed').length;
  const verifiedClosedCount = issues.filter((i) => i.status === 'Verified Closed').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C58A66] font-bold">
              {ward.ward_name}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#5E6F63]" />
            <span className="text-[10px] font-mono uppercase text-[#A3AD9C]">Operator Station</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#26302A] tracking-tight">
            Municipal Operator Command Center
          </h1>
          <p className="text-xs text-[#5E6F63] mt-1 max-w-xl">
            Ward-scoped defect triage, emergency maintenance crew dispatch, and SLA compliance monitoring.
          </p>
        </div>

        <Link href="/official/map">
          <Button size="sm" className="flex items-center gap-2 bg-[#26302A] hover:bg-[#34423a] text-[#F6F4EF] shadow-sm">
            <MapPin className="h-4 w-4 text-[#C58A66]" />
            <span>Open Ward Dispatch Map</span>
          </Button>
        </Link>
      </div>

      {/* SLA Alert Banner if breaches exist */}
      {slaBreachCount > 0 && (
        <div className="p-4 rounded-2xl bg-[#A84835]/10 border border-[#A84835]/30 text-[#702115] flex items-start gap-3 shadow-2xs">
          <Flame className="h-5 w-5 text-[#A84835] shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-serif font-bold text-sm text-[#702115]">
              Mandatory Action: {slaBreachCount} {slaBreachCount === 1 ? 'Ticket' : 'Tickets'} Exceeding Statutory SLA Deadlines
            </p>
            <p className="text-[#8A3020] mt-0.5 leading-relaxed font-sans">
              Escalation notices have been batched and flagged to the Municipal Commissioner. Field crew remediation requires priority dispatch.
            </p>
          </div>
        </div>
      )}

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Open Work Orders"
          value={openCount}
          icon={<HardHat className="h-5 w-5" />}
          color="bark"
        />
        <StatCard
          title="SLA Compliance Breaches"
          value={slaBreachCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="clay"
        />
        <StatCard
          title="Pending AI Audits"
          value={pendingAuditCount}
          icon={<Clock className="h-5 w-5" />}
          color="moss"
        />
        <StatCard
          title="Verified Remediations"
          value={verifiedClosedCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="moss"
        />
      </div>

      {/* Prioritized Ward Ticket Queue */}
      <Card className="p-5 sm:p-6 space-y-4 bg-white/70 backdrop-blur-sm border border-[#E4E0D6] shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E4E0D6] pb-3">
          <div>
            <h2 className="text-base font-serif font-bold text-[#26302A]">
              Prioritized Ward Work-Order Queue
            </h2>
            <p className="text-xs text-[#5E6F63]">
              Ranked by Severity (S4 Critical foremost) followed by SLA countdown.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-[#E4E0D6] text-xs bg-[#F6F4EF] text-[#26302A] outline-none cursor-pointer hover:border-[#A3AD9C] transition font-sans"
            >
              <option value="all">All Lifecycle States</option>
              <option value="Reported">Reported</option>
              <option value="In Progress">In Progress</option>
              <option value="Repair Claimed">Repair Claimed</option>
              <option value="Escalated">Escalated</option>
              <option value="Verified Closed">Verified Closed</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-[#E4E0D6] text-xs bg-[#F6F4EF] text-[#26302A] outline-none cursor-pointer hover:border-[#A3AD9C] transition font-sans"
            >
              <option value="all">All Severities</option>
              <option value="4">S4 Critical</option>
              <option value="3">S3 High</option>
              <option value="2">S2 Medium</option>
              <option value="1">S1 Low</option>
            </select>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <Spinner size="md" />
            <p className="text-xs font-mono uppercase tracking-widest text-[#5E6F63]">
              Synchronizing Municipal Queue...
            </p>
          </div>
        ) : filteredTickets.length === 0 ? (
          /* Empty state */
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6] flex items-center justify-center mx-auto text-[#5E6F63]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="font-serif font-bold text-sm text-[#26302A]">Work Queue Clear</h4>
            <p className="text-xs text-[#5E6F63] max-w-xs mx-auto">
              No tickets match the selected filters for this municipal jurisdiction.
            </p>
          </div>
        ) : (
          /* Tickets Table / Cards */
          <div className="space-y-3 pt-1">
            {filteredTickets.map((ticket) => {
              const sla = getSLAStatus(ticket.sla_due_at);
              const isCritical = ticket.severity === 4;

              return (
                <div
                  key={ticket.id}
                  className={`p-4 rounded-2xl border transition ${
                    isCritical && ticket.status !== 'Verified Closed'
                      ? 'border-[#A84835]/30 bg-[#A84835]/5'
                      : 'border-[#E4E0D6] bg-[#F6F4EF]/70 hover:bg-[#F6F4EF]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Left Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-[#A3AD9C]">
                          #{ticket.id.slice(0, 8)}
                        </span>
                        <SeverityBadge severity={ticket.severity} />
                        <StatusBadge status={ticket.status} />
                        {sla.isBreached && ticket.status !== 'Verified Closed' && (
                          <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-[#A84835]/20 text-[#702115]">
                            SLA Overdue
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-serif font-bold text-[#26302A]">
                        {ticket.category} — {ticket.asset?.name || 'Municipal Corridor Asset'}
                      </h3>

                      <p className="text-xs text-[#5E6F63] line-clamp-1 font-sans">
                        {ticket.human_final_json?.technical_summary || ticket.ai_raw_json?.technical_summary || 'Citizen report pending field crew assessment.'}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-[#A3AD9C] pt-0.5 font-mono">
                        <span>Reported: {formatDate(ticket.created_at)}</span>
                        <span>•</span>
                        <span className={sla.isBreached ? 'text-[#A84835] font-bold' : 'text-[#5E6F63]'}>
                          SLA Target: {sla.label}
                        </span>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2.5 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#E4E0D6]">
                      <Link href={`/official/update/${ticket.id}`}>
                        <Button
                          size="sm"
                          className="flex items-center gap-1.5 text-xs py-1.5 px-3.5 bg-[#26302A] hover:bg-[#34423a] text-[#F6F4EF]"
                        >
                          <FileEdit className="h-3.5 w-3.5 text-[#C58A66]" />
                          <span>Update Progress</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
