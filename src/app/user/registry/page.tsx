'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Search,
  Filter,
  PlusCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  MapPin,
  Building2,
  Activity,
  History,
  CheckCircle2,
} from 'lucide-react';
import { Button, Card, Badge, SeverityBadge, StatusBadge } from '@/components/ui/shared';
import { MOCK_ASSETS, MOCK_ISSUES } from '@/lib/mock-data';
import { Asset, Issue } from '@/types';
import { formatDate } from '@/lib/utils';
import { AssetDetailSlideOver } from '@/components/map/AssetDetailSlideOver';

export default function AssetRegistryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedWard, setSelectedWard] = useState('all');
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return MOCK_ASSETS.filter((asset) => {
      if (selectedType !== 'all' && asset.asset_type !== selectedType) return false;
      if (selectedWard !== 'all' && asset.authority_id !== selectedWard) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          asset.name.toLowerCase().includes(query) ||
          asset.authority?.ward_name.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [selectedType, selectedWard, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedAssetId((prev) => (prev === id ? null : id));
  };

  const openSlideOver = (asset: Asset) => {
    const issue = MOCK_ISSUES.find((i) => i.asset_id === asset.id);
    setSelectedAsset(asset);
    setSelectedIssue(issue || null);
    setSlideOverOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <AssetDetailSlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        asset={selectedAsset}
        issue={selectedIssue}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1B365D] tracking-tight">
            Public Asset & Defect Registry
          </h1>
          <p className="text-xs text-slate-500">
            Immutable public directory of civic infrastructure, structural health ratings, and repair audit trails.
          </p>
        </div>

        <Link href="/user/report">
          <Button size="sm" className="flex items-center gap-1.5 shadow-sm">
            <PlusCircle className="h-4 w-4" />
            <span>Report Defect on Asset</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-3 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by asset name, corridor or ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-medium outline-none cursor-pointer"
          >
            <option value="all">All Asset Types</option>
            <option value="road">🛣️ Roads</option>
            <option value="bus_stop">🚏 Bus Stops</option>
            <option value="footpath">🚶 Footpaths</option>
            <option value="overbridge">🌉 Pedestrian Overbridges</option>
          </select>

          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-medium outline-none cursor-pointer"
          >
            <option value="all">All Municipal Wards</option>
            <option value="a1000000-0000-0000-0000-000000000001">Ward A (Colaba / Fort)</option>
            <option value="a2000000-0000-0000-0000-000000000002">Ward K/East (Andheri East)</option>
            <option value="a3000000-0000-0000-0000-000000000003">Ward H/West (Bandra West)</option>
            <option value="a4000000-0000-0000-0000-000000000004">Ward L (Kurla)</option>
          </select>
        </div>
      </Card>

      {/* Asset Directory Cards */}
      <div className="space-y-3">
        {filteredAssets.map((asset) => {
          const linkedIssue = MOCK_ISSUES.find((i) => i.asset_id === asset.id);
          const isExpanded = expandedAssetId === asset.id;
          const score = asset.condition_score;
          const scoreColor =
            score > 70
              ? 'bg-emerald-500'
              : score > 40
              ? 'bg-amber-500'
              : 'bg-red-500';

          return (
            <Card key={asset.id} className="overflow-hidden border border-slate-200 shadow-xs hover:border-slate-300 transition">
              <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Left info */}
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 text-lg shrink-0">
                    {asset.asset_type === 'road'
                      ? '🛣️'
                      : asset.asset_type === 'bus_stop'
                      ? '🚏'
                      : asset.asset_type === 'footpath'
                      ? '🚶'
                      : '🌉'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{asset.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {asset.asset_type.replace('_', ' ')}
                      </span>
                      {linkedIssue && (
                        <StatusBadge status={linkedIssue.status} />
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer"
                        onClick={() => openSlideOver(asset)}>
                      {asset.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {asset.authority?.ward_name || 'Municipal Ward'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {asset.lat?.toFixed(4)}° N, {asset.lng?.toFixed(4)}° E
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Metrics: Condition Score & Actions */}
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Condition Progress Bar */}
                  <div className="text-right min-w-[120px]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 text-[11px] font-medium">Condition:</span>
                      <strong className="text-slate-900 font-bold">{score} / 100</strong>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSlideOver(asset)}
                      className="text-xs py-1.5 px-3"
                    >
                      <span>Details</span>
                    </Button>

                    {linkedIssue && linkedIssue.status_updates && linkedIssue.status_updates.length > 0 && (
                      <button
                        onClick={() => toggleExpand(asset.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        title="Toggle Audit Trail"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable Audit History */}
              {isExpanded && linkedIssue && linkedIssue.status_updates && (
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <History className="h-3.5 w-3.5 text-blue-600" />
                    <span>Chronological Audit Trail for #{linkedIssue.id.slice(0, 8)}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {linkedIssue.status_updates.map((update) => (
                      <div key={update.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900">{update.new_status}</span>
                            {update.audit_verdict && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                AI Audit: {update.audit_verdict} ({((update.audit_confidence || 0.95) * 100).toFixed(0)}%)
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600">{update.notes}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formatDate(update.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
