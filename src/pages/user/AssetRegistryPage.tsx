import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Badge, Button, Spinner, SeverityBadge } from '@/components/ui/shared';
import { fetchAssets, fetchIssues } from '@/lib/data-service';
import { MOCK_ASSETS, MOCK_ISSUES } from '@/lib/mock-data';
import { Asset, Issue } from '@/types';
import {
  Search,
  Filter,
  Layers,
  ExternalLink,
  MapPin,
  Plus,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Sparkles,
  Camera,
  CheckCircle2,
  Calendar,
  Eye,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function AssetRegistryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assets' | 'issues'>('assets');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [selectedIssueDetail, setSelectedIssueDetail] = useState<Issue | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [a, i] = await Promise.all([fetchAssets(), fetchIssues()]);
        setAssets(a && a.length > 0 ? a : MOCK_ASSETS);
        setIssues(i && i.length > 0 ? i : MOCK_ISSUES);
      } catch (err) {
        console.error('Failed to load asset registry:', err);
        setAssets(MOCK_ASSETS);
        setIssues(MOCK_ISSUES);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleExpandAsset = (assetId: string) => {
    setExpandedAssetId((prev) => (prev === assetId ? null : assetId));
  };

  const filteredAssets = assets.filter((asset) => {
    if (typeFilter !== 'all' && asset.asset_type !== typeFilter) return false;
    if (search) {
      const q = search.trim().toLowerCase();
      const name = (asset.name || '').toLowerCase();
      const ward = (asset.authority?.ward_name || '').toLowerCase();
      const type = (asset.asset_type || '').toLowerCase();
      if (!name.includes(q) && !ward.includes(q) && !type.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const filteredIssues = issues.filter((issue) => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (search) {
      const q = search.trim().toLowerCase();
      const cat = (issue.category || '').toLowerCase();
      const assetName = (issue.asset?.name || '').toLowerCase();
      const ward = (issue.authority?.ward_name || '').toLowerCase();
      const summary = (
        issue.human_final_json?.technical_summary ||
        issue.ai_raw_json?.technical_summary ||
        ''
      ).toLowerCase();
      if (!cat.includes(q) && !assetName.includes(q) && !ward.includes(q) && !summary.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const goodCount = assets.filter((a) => a.condition_score >= 70).length;
  const criticalCount = assets.filter((a) => a.condition_score < 50).length;
  const openIssuesCount = issues.filter((i) => i.status !== 'Verified Closed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#EDE9E0] p-6 rounded-2xl border border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#26302A] text-white text-[11px] font-semibold mb-2">
            <span>BBMP Bengaluru Jurisdiction</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#26302A]">
            Municipal Asset & Grievance Registry
          </h1>
          <p className="text-sm text-[#5E6F63] mt-0.5">
            Active surveillance of Bengaluru corridors, Tender SURE footpaths, BMTC shelters, and verified citizen defect reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/user/report">
            <Button variant="clay" size="sm" className="gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              <span>Report Defect</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab('assets')}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-all ${
            activeTab === 'assets'
              ? 'bg-white border-[#26302A] ring-1 ring-[#26302A]'
              : 'bg-white/80 border-[#E4E0D6] hover:bg-white'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E6F63]">
            Monitored Assets
          </span>
          <p className="text-2xl font-serif font-bold text-[#26302A] mt-1">
            {assets.length}
          </p>
          <span className="text-[10px] text-[#5E6F63]">Arterials, footpaths & shelters</span>
        </div>

        <div
          onClick={() => setActiveTab('issues')}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-all ${
            activeTab === 'issues'
              ? 'bg-white border-[#C58A66] ring-1 ring-[#C58A66]'
              : 'bg-white/80 border-[#E4E0D6] hover:bg-white'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C58A66]">
            Reported Issues
          </span>
          <p className="text-2xl font-serif font-bold text-[#C58A66] mt-1">
            {issues.length}
          </p>
          <span className="text-[10px] text-[#A84835] font-semibold">
            {openIssuesCount} Active in Ward SLA
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E4E0D6] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E6F63]">
            Good Condition (70+)
          </span>
          <p className="text-2xl font-serif font-bold text-[#15803D] mt-1">
            {goodCount}
          </p>
          <span className="text-[10px] text-[#15803D] font-medium">Standard compliant</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E4E0D6] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E6F63]">
            BBMP Zones
          </span>
          <p className="text-2xl font-serif font-bold text-[#26302A] mt-1">
            4 Zones
          </p>
          <span className="text-[10px] text-[#5E6F63]">East, South, Mahadevapura, West</span>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex border-b border-[#E4E0D6] gap-2">
        <button
          onClick={() => setActiveTab('assets')}
          className={`pb-3 px-4 font-serif font-bold text-sm sm:text-base border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'assets'
              ? 'border-[#26302A] text-[#26302A]'
              : 'border-transparent text-[#5E6F63] hover:text-[#26302A]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Infrastructure Assets ({assets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`pb-3 px-4 font-serif font-bold text-sm sm:text-base border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'issues'
              ? 'border-[#C58A66] text-[#C58A66]'
              : 'border-transparent text-[#5E6F63] hover:text-[#26302A]'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-[#C58A66]" />
          <span>Reported Issues ({issues.length})</span>
          {openIssuesCount > 0 && (
            <span className="px-2 py-0.2 rounded-full bg-[#A84835]/15 text-[#A84835] text-xs font-bold font-sans">
              {openIssuesCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter and Search Controls */}
      <Card className="p-4 sm:p-5 bg-white border-[#E4E0D6] shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#5E6F63] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'assets'
                  ? 'Search assets by name, ward or corridor (e.g. Indiranagar, Bellandur)...'
                  : 'Search reported defects by category, ticket ID or notes...'
              }
              className="pl-10 bg-[#F6F4EF]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#5E6F63] shrink-0" />
            {activeTab === 'assets' ? (
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#F6F4EF]"
              >
                <option value="all">All Infrastructure Types</option>
                <option value="road">Roads & Arterials</option>
                <option value="footpath">Pedestrian Footpaths</option>
                <option value="bus_stop">Transit Bus Shelters</option>
                <option value="overbridge">Pedestrian Overbridges</option>
              </Select>
            ) : (
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#F6F4EF]"
              >
                <option value="all">All Ticket Statuses</option>
                <option value="Reported">Reported</option>
                <option value="In Progress">In Progress</option>
                <option value="Repair Claimed">Repair Claimed</option>
                <option value="Verified Closed">Verified Closed</option>
              </Select>
            )}
          </div>
        </div>
      </Card>

      {/* TAB 1: ASSETS TABLE WITH EXPANDABLE LINKED ISSUES */}
      {activeTab === 'assets' && (
        <Card className="overflow-hidden p-0 border-[#E4E0D6] shadow-sm bg-white">
          {loading ? (
            <div className="py-16 text-center">
              <Spinner />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-16 text-center text-[#5E6F63] space-y-2">
              <AlertCircle className="w-8 h-8 text-[#5E6F63] mx-auto" />
              <p className="font-semibold text-sm text-[#26302A]">No infrastructure assets matched your query.</p>
              <p className="text-xs text-[#5E6F63]">Try clearing search filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#EDE9E0] border-b border-[#E4E0D6] text-xs font-bold uppercase tracking-wider text-[#26302A]">
                  <tr>
                    <th className="py-4 px-6">Asset Name</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">BBMP Municipal Ward</th>
                    <th className="py-4 px-6">Condition</th>
                    <th className="py-4 px-6">Reported Issues</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E0D6] bg-[#F6F4EF]/60">
                  {filteredAssets.map((asset) => {
                    const linkedIssues = issues.filter(
                      (i) => i.asset_id === asset.id || i.asset?.id === asset.id
                    );
                    const openIssues = linkedIssues.filter((i) => i.status !== 'Verified Closed');
                    const isExpanded = expandedAssetId === asset.id;

                    return (
                      <React.Fragment key={asset.id}>
                        <tr
                          onClick={() => toggleExpandAsset(asset.id)}
                          className="hover:bg-[#EDE9E0]/50 transition-colors cursor-pointer group"
                        >
                          <td className="py-4 px-6 font-semibold text-[#26302A]">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-[#C58A66] shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-[#5E6F63] group-hover:text-[#26302A] shrink-0" />
                              )}
                              <span>{asset.name}</span>
                            </div>
                            {asset.lat && asset.lng && (
                              <div className="text-[11px] font-normal text-[#5E6F63] flex items-center gap-1 mt-0.5 ml-6">
                                <MapPin className="w-3 h-3 text-[#C58A66]" />
                                <span>
                                  {asset.lat.toFixed(4)}° N, {asset.lng.toFixed(4)}° E
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className="capitalize px-2.5 py-1 rounded-md bg-[#E4E0D6] text-xs font-medium text-[#26302A]">
                              {asset.asset_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-[#5E6F63]">
                            {asset.authority?.ward_name || 'BBMP East Zone'}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-[#E4E0D6] rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    asset.condition_score > 70
                                      ? 'bg-[#15803D]'
                                      : asset.condition_score > 40
                                      ? 'bg-[#C58A66]'
                                      : 'bg-[#A84835]'
                                  }`}
                                  style={{ width: `${asset.condition_score}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-[#26302A]">
                                {asset.condition_score}/100
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {openIssues.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#A84835]/15 text-[#A84835]">
                                <AlertTriangle className="w-3 h-3" />
                                {openIssues.length} Open ({linkedIssues.length} total)
                              </span>
                            ) : linkedIssues.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#15803D]/15 text-[#15803D]">
                                <CheckCircle2 className="w-3 h-3" />
                                {linkedIssues.length} Resolved
                              </span>
                            ) : (
                              <span className="text-xs text-[#5E6F63]">0 Reported</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center justify-end gap-2"
                            >
                              <Link
                                to="/user/map"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#5E6F63] hover:text-[#26302A] px-2.5 py-1 rounded-lg border border-[#E4E0D6] bg-white hover:bg-[#EDE9E0]"
                              >
                                Map <ExternalLink className="w-3 h-3" />
                              </Link>
                              <Link
                                to="/user/report"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#26302A] bg-[#EDE9E0] hover:bg-[#E4E0D6] px-2.5 py-1 rounded-lg"
                              >
                                Report
                              </Link>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Sub-Row: Linked Issues */}
                        {isExpanded && (
                          <tr className="bg-[#EDE9E0]/30 border-b border-[#E4E0D6]">
                            <td colSpan={6} className="py-4 px-8">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-[#C58A66]" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#26302A]">
                                      Reported Defect Issues on this Asset ({linkedIssues.length})
                                    </h4>
                                  </div>
                                  <Link
                                    to="/user/report"
                                    className="text-xs font-bold text-[#C58A66] hover:underline"
                                  >
                                    + Report New Defect on This Corridor
                                  </Link>
                                </div>

                                {linkedIssues.length === 0 ? (
                                  <div className="p-4 rounded-xl bg-white border border-[#E4E0D6] text-xs text-[#5E6F63]">
                                    No defect grievances currently logged for this asset. Tap{' '}
                                    <Link to="/user/report" className="font-bold text-[#26302A] underline">
                                      Report Defect
                                    </Link>{' '}
                                    to register photographic evidence.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {linkedIssues.map((issue) => {
                                      const photoUrl =
                                        issue.media?.[0]?.file_url ||
                                        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400';
                                      const summary =
                                        issue.human_final_json?.technical_summary ||
                                        issue.ai_raw_json?.technical_summary ||
                                        issue.human_final_json?.description ||
                                        'Civic hazard logged for BBMP crew dispatch.';

                                      return (
                                        <div
                                          key={issue.id}
                                          onClick={() => setSelectedIssueDetail(issue)}
                                          className="p-3.5 rounded-xl bg-white border border-[#E4E0D6] hover:border-[#C58A66] transition-all cursor-pointer flex gap-3 shadow-xs"
                                        >
                                          <img
                                            src={photoUrl}
                                            alt={issue.category}
                                            className="w-18 h-18 object-cover rounded-lg border border-[#E4E0D6] shrink-0"
                                          />
                                          <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-xs font-bold text-[#26302A] truncate">
                                                {issue.category}
                                              </span>
                                              <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                  issue.status === 'Verified Closed'
                                                    ? 'bg-[#15803D]/10 text-[#15803D]'
                                                    : issue.status === 'In Progress'
                                                    ? 'bg-[#C58A66]/15 text-[#C58A66]'
                                                    : 'bg-[#A84835]/15 text-[#A84835]'
                                                }`}
                                              >
                                                {issue.status}
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-[#5E6F63] line-clamp-2 leading-relaxed">
                                              {summary}
                                            </p>
                                            <div className="flex items-center justify-between pt-1 text-[10px] text-[#5E6F63]">
                                              <span className="font-mono">
                                                STP-{issue.id.slice(0, 8).toUpperCase()}
                                              </span>
                                              <SeverityBadge severity={issue.severity} />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: ALL REPORTED ISSUES QUEUE */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#5E6F63] px-1">
            <span>
              Showing {filteredIssues.length} reported grievances across BBMP Bengaluru wards
            </span>
            <span className="font-semibold text-[#26302A]">
              Deterministic Ward Routing Active
            </span>
          </div>

          {filteredIssues.length === 0 ? (
            <Card className="p-12 text-center text-[#5E6F63] space-y-3 bg-white border-[#E4E0D6]">
              <AlertCircle className="w-10 h-10 text-[#5E6F63] mx-auto" />
              <h3 className="text-base font-bold text-[#26302A]">No Reported Defect Issues Found</h3>
              <p className="text-xs text-[#5E6F63] max-w-md mx-auto">
                No issues match your current filters. Submit a new photo evidence report to register a defect in the BBMP civic queue.
              </p>
              <Link to="/user/report">
                <Button variant="clay" size="sm" className="mt-2">
                  Report New Defect
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredIssues.map((issue) => {
                const photoUrl =
                  issue.media?.[0]?.file_url ||
                  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800';
                const summary =
                  issue.human_final_json?.technical_summary ||
                  issue.ai_raw_json?.technical_summary ||
                  issue.human_final_json?.description ||
                  'Structural surface defect captured via civic inspection camera.';
                const assetName =
                  issue.asset?.name || 'Bengaluru Municipal Corridor';
                const wardName =
                  issue.authority?.ward_name || 'BBMP East Zone';

                return (
                  <Card
                    key={issue.id}
                    onClick={() => setSelectedIssueDetail(issue)}
                    className="p-5 bg-white border-[#E4E0D6] hover:border-[#26302A] transition-all cursor-pointer shadow-sm hover:shadow-md space-y-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={photoUrl}
                        alt={issue.category}
                        className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-[#E4E0D6] shrink-0"
                      />
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#5E6F63]">
                            STP-{issue.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              issue.status === 'Verified Closed'
                                ? 'bg-[#15803D]/10 text-[#15803D]'
                                : issue.status === 'In Progress'
                                ? 'bg-[#C58A66]/15 text-[#C58A66]'
                                : 'bg-[#A84835]/15 text-[#A84835]'
                            }`}
                          >
                            {issue.status}
                          </span>
                        </div>

                        <h3 className="font-serif font-bold text-base text-[#26302A] truncate">
                          {issue.category}
                        </h3>

                        <p className="text-xs text-[#5E6F63] flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#C58A66] shrink-0" />
                          <span>{assetName}</span>
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <SeverityBadge severity={issue.severity} />
                          <span className="text-[11px] text-[#5E6F63] font-medium">
                            {wardName.split('(')[0]?.trim()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Diagnostic snippet */}
                    <div className="p-3 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] text-xs text-[#26302A] line-clamp-2 leading-relaxed">
                      {summary}
                    </div>

                    {/* Footer / Actions */}
                    <div className="pt-2 border-t border-[#E4E0D6] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#5E6F63]">
                        <Clock className="w-3.5 h-3.5 text-[#C58A66]" />
                        <span>
                          SLA:{' '}
                          {issue.sla_due_at
                            ? new Date(issue.sla_due_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : '14 Days'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to="/user/map"
                          className="px-2.5 py-1 rounded-lg border border-[#E4E0D6] bg-white hover:bg-[#EDE9E0] text-[11px] font-semibold text-[#26302A] flex items-center gap-1"
                        >
                          View Map <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => setSelectedIssueDetail(issue)}
                          className="px-2.5 py-1 rounded-lg bg-[#26302A] text-white text-[11px] font-semibold hover:bg-[#3D4B41]"
                        >
                          Audit Details
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL / DRAWER FOR SELECTED ISSUE */}
      {selectedIssueDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#26302A]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#F6F4EF] p-6 sm:p-8 shadow-2xl border border-[#E4E0D6] space-y-6">
            <button
              onClick={() => setSelectedIssueDetail(null)}
              className="absolute right-4 top-4 p-2 rounded-lg text-[#5E6F63] hover:bg-[#E4E0D6] hover:text-[#26302A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#C58A66]">
                  STP-{selectedIssueDetail.id.slice(0, 8).toUpperCase()}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedIssueDetail.status === 'Verified Closed'
                      ? 'bg-[#15803D]/10 text-[#15803D]'
                      : 'bg-[#A84835]/15 text-[#A84835]'
                  }`}
                >
                  {selectedIssueDetail.status}
                </span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#26302A]">
                {selectedIssueDetail.category}
              </h2>
              <p className="text-xs text-[#5E6F63]">
                Corridor: {selectedIssueDetail.asset?.name || 'Bengaluru Road'} • {selectedIssueDetail.authority?.ward_name}
              </p>
            </div>

            {/* Photo Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E6F63]">
                  Before Photo (Citizen Evidence)
                </span>
                <img
                  src={
                    selectedIssueDetail.media?.[0]?.file_url ||
                    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800'
                  }
                  alt="Defect"
                  className="w-full h-48 object-cover rounded-xl border border-[#E4E0D6]"
                />
              </div>

              {selectedIssueDetail.media?.[1]?.file_url ? (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#15803D]">
                    After Photo (Crew Repair Work)
                  </span>
                  <img
                    src={selectedIssueDetail.media[1].file_url}
                    alt="Repaired"
                    className="w-full h-48 object-cover rounded-xl border border-[#E4E0D6]"
                  />
                </div>
              ) : (
                <div className="h-48 rounded-xl bg-[#EDE9E0] border border-dashed border-[#A3AD9C] flex flex-col items-center justify-center text-center p-4">
                  <Clock className="w-8 h-8 text-[#C58A66] mb-2" />
                  <span className="text-xs font-bold text-[#26302A]">Awaiting Repair Completion</span>
                  <p className="text-[11px] text-[#5E6F63] mt-1">
                    BBMP contractor dispatch scheduled within statutory SLA.
                  </p>
                </div>
              )}
            </div>

            {/* Technical Diagnostics */}
            <div className="p-4 rounded-xl bg-white border border-[#E4E0D6] space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C58A66]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#26302A]">
                  AI Engineering Diagnostics
                </h4>
              </div>
              <p className="text-xs text-[#26302A] leading-relaxed">
                {selectedIssueDetail.human_final_json?.description ||
                  selectedIssueDetail.ai_raw_json?.description ||
                  'Surface degradation detected on civic asset corridor.'}
              </p>
              <div className="pt-2 border-t border-[#E4E0D6] flex items-center justify-between text-xs">
                <span className="text-[#5E6F63]">Prescribed Remedy:</span>
                <span className="font-semibold text-[#26302A]">
                  {selectedIssueDetail.human_final_json?.suggested_action ||
                    selectedIssueDetail.ai_raw_json?.suggested_action ||
                    'Bituminous resurfacing and mechanical compaction'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIssueDetail(null)}
              >
                Close
              </Button>
              <Link to="/user/map">
                <Button variant="clay" size="sm" className="gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>Locate on Map</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
