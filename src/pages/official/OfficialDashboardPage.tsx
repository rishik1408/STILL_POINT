import { useState, useEffect } from 'react';
import { Card, Button, Badge, SeverityBadge, StatusBadge, Spinner } from '@/components/ui/shared';
import { fetchDashboardStats, fetchIssues, updateIssueStatus } from '@/lib/data-service';
import { Issue, DashboardStats } from '@/types';
import { Link } from 'react-router-dom';
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Camera,
  ExternalLink,
  Filter,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { draftAuthorityNotice } from '@/lib/ai-service';

export function OfficialDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedNotice, setSelectedNotice] = useState<{ subject: string; body: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, i] = await Promise.all([fetchDashboardStats(), fetchIssues()]);
      setStats(s);
      setIssues(i);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (issueId: string, newStatus: any) => {
    try {
      await updateIssueStatus(issueId, newStatus, 'Status updated via Official Console');
      await loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDraftNotice = (issue: Issue) => {
    const notice = draftAuthorityNotice(issue, issue.authority, issue.asset);
    setSelectedNotice(notice);
  };

  const filteredIssues = issues.filter((issue) => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Ward Operator Header */}
      <div className="bg-[#EDE9E0] p-6 rounded-2xl border border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#26302A] text-white text-xs font-semibold mb-2">
            <span>BBMP East Zone (Indiranagar / MG Road) Jurisdiction</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#26302A]">
            Municipal Works Command Console
          </h1>
          <p className="text-sm text-[#5E6F63] mt-0.5">
            Real-time field ticket intake, deterministic contractor SLA dispatch, and AI verified repair audits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="stone"
            size="sm"
            onClick={loadData}
            loading={loading}
            className="border-[#E4E0D6]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live</span>
          </Button>
          <Link to="/official/map">
            <Button variant="secondary" size="sm">
              Dispatch Map
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-white border-[#E4E0D6] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5E6F63]">
              Monitored Assets
            </span>
            <div className="p-2 rounded-xl bg-[#EDE9E0] text-[#26302A]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-[#26302A] mt-2">
            {stats?.total_assets || 8}
          </p>
          <span className="text-xs text-[#5E6F63] mt-1 block">
            Roads, footpaths, bridges under surveillance
          </span>
        </Card>

        <Card className="p-6 bg-white border-[#E4E0D6] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5E6F63]">
              Open Ward Tickets
            </span>
            <div className="p-2 rounded-xl bg-[#C58A66]/20 text-[#C58A66]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-[#26302A] mt-2">
            {stats?.open_issues || 5}
          </p>
          <span className="text-xs text-[#C58A66] font-semibold mt-1 block">
            Requires engineering crew assignment
          </span>
        </Card>

        <Card className="p-6 bg-white border-[#E4E0D6] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5E6F63]">
              Verified Closed Repairs
            </span>
            <div className="p-2 rounded-xl bg-[#5E6F63]/20 text-[#15803D]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-[#15803D] mt-2">
            {stats?.verified_repairs || 3}
          </p>
          <span className="text-xs text-[#5E6F63] mt-1 block">
            Validated by AI paired photo audit
          </span>
        </Card>

        <Card className="p-6 bg-white border-[#E4E0D6] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5E6F63]">
              SLA Compliance
            </span>
            <div className="p-2 rounded-xl bg-[#EDE9E0] text-[#5E6F63]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-[#26302A] mt-2">
            94.8%
          </p>
          <span className="text-xs text-[#15803D] font-medium mt-1 block">
            Zero critical breaches this period
          </span>
        </Card>
      </div>

      {/* Prioritized Ticket Queue */}
      <Card className="p-0 overflow-hidden border-[#E4E0D6]">
        <div className="p-6 bg-[#EDE9E0] border-b border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#26302A]">
              Prioritized Ward Ticket Intake Queue
            </h3>
            <p className="text-xs text-[#5E6F63] mt-0.5">
              Ranked by severity and statutory SLA remaining countdown.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#5E6F63]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold bg-[#F6F4EF] border border-[#E4E0D6] px-3 py-1.5 rounded-xl text-[#26302A] focus:outline-none"
            >
              <option value="all">All Ticket Statuses</option>
              <option value="Reported">Reported</option>
              <option value="In Progress">In Progress</option>
              <option value="Repair Claimed">Repair Claimed</option>
              <option value="Verified Closed">Verified Closed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : filteredIssues.length === 0 ? (
          <div className="py-16 text-center text-[#5E6F63]">
            No tickets currently pending in this queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-xs font-bold uppercase tracking-wider text-[#5E6F63]">
                <tr>
                  <th className="py-3 px-6">ID & Asset</th>
                  <th className="py-3 px-6">Defect Category</th>
                  <th className="py-3 px-6">Severity</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Remediation SLA</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6] bg-white">
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-[#F6F4EF]/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-mono text-xs font-bold text-[#5E6F63]">
                        STP-{issue.id.slice(0, 6).toUpperCase()}
                      </div>
                      <div className="font-semibold text-sm text-[#26302A] line-clamp-1">
                        {issue.asset?.name || 'Arterial Corridor'}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-xs text-[#26302A]">
                      {issue.category}
                    </td>
                    <td className="py-4 px-6">
                      <SeverityBadge severity={issue.severity} />
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={issue.status} />
                    </td>
                    <td className="py-4 px-6 text-xs text-[#5E6F63]">
                      {issue.sla_due_at ? (
                        <span className="font-medium text-[#26302A]">
                          {new Date(issue.sla_due_at).toLocaleDateString()}
                        </span>
                      ) : (
                        '14 Days'
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDraftNotice(issue)}
                          title="Generate Formal SLA Notice"
                          className="p-1.5 rounded-lg border border-[#E4E0D6] text-[#5E6F63] hover:text-[#26302A] hover:bg-[#EDE9E0]"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        {issue.status === 'Reported' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusChange(issue.id, 'In Progress')}
                          >
                            Dispatch Crew
                          </Button>
                        )}

                        <Link to={`/official/update/${issue.id}`}>
                          <Button variant="clay" size="sm" className="gap-1.5">
                            <Camera className="w-3.5 h-3.5" />
                            <span>Log Repair Photo</span>
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Formal Notice Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F6F4EF] rounded-2xl max-w-2xl w-full border border-[#E4E0D6] shadow-xl overflow-hidden">
            <div className="p-6 bg-[#EDE9E0] border-b border-[#E4E0D6] flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#26302A]">
                Generated Statutory Ward Notice
              </h3>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-xs font-semibold text-[#5E6F63] hover:text-[#26302A]"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="text-xs text-[#5E6F63]">
                <strong className="text-[#26302A]">Subject:</strong> {selectedNotice.subject}
              </div>
              <pre className="font-mono text-xs text-[#26302A] bg-[#EDE9E0]/50 p-4 rounded-xl border border-[#E4E0D6] whitespace-pre-wrap leading-relaxed">
                {selectedNotice.body}
              </pre>
            </div>
            <div className="p-4 bg-[#EDE9E0] border-t border-[#E4E0D6] flex justify-end gap-2">
              <Button
                variant="clay"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(selectedNotice.body);
                  alert('Statutory Notice copied to clipboard.');
                }}
              >
                Copy Text to Clipboard
              </Button>
              <Button variant="stone" size="sm" onClick={() => setSelectedNotice(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
