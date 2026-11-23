'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button, Card, Badge, SeverityBadge, StatusBadge, Spinner, EmptyState } from '@/components/ui/shared';
import { fetchAssets, fetchIssues, fetchAuthorities } from '@/lib/data-service';
import { Asset, Issue, Authority } from '@/types';
import { formatDate } from '@/lib/utils';
import { AssetDetailSlideOver } from '@/components/map/AssetDetailSlideOver';
import { StillPointLogo } from '@/components/ui/StillPointLogo';

export default function AssetRegistryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedWard, setSelectedWard] = useState('all');
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadRegistryData() {
      try {
        setLoading(true);
        const [loadedAssets, loadedIssues, loadedAuths] = await Promise.all([
          fetchAssets(),
          fetchIssues(),
          fetchAuthorities(),
        ]);
        if (isMounted) {
          setAssets(loadedAssets);
          setIssues(loadedIssues);
          setAuthorities(loadedAuths);
        }
      } catch (err) {
        console.error('Failed to load asset registry data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRegistryData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (selectedType !== 'all' && asset.asset_type !== selectedType) return false;
      if (selectedWard !== 'all' && asset.authority_id !== selectedWard) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          asset.name.toLowerCase().includes(query) ||
          asset.authority?.ward_name?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [assets, selectedType, selectedWard, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedAssetId((prev) => (prev === id ? null : id));
  };

  const openSlideOver = (asset: Asset) => {
    const issue = issues.find((i) => i.asset_id === asset.id);
    setSelectedAsset(asset);
    setSelectedIssue(issue || null);
    setSlideOverOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <AssetDetailSlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        asset={selectedAsset}
        issue={selectedIssue}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#5E6F63] font-semibold">
              Public Ledger
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C58A66]" />
            <span className="text-[10px] font-mono uppercase text-[#A3AD9C]">Municipal Asset Index</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#26302A] tracking-tight">
            Civic Asset & Infrastructure Registry
          </h1>
          <p className="text-xs text-[#5E6F63] mt-1 max-w-xl">
            Immutable public directory of civic infrastructure, structural health ratings, and repair audit trails.
          </p>
        </div>

        <Link href="/user/report">
          <Button size="sm" className="flex items-center gap-1.5 bg-[#26302A] hover:bg-[#34423a] text-[#F6F4EF] shadow-sm">
            <PlusCircle className="h-4 w-4 text-[#C58A66]" />
            <span>Report Defect on Asset</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-3 bg-white/70 backdrop-blur-sm border border-[#E4E0D6] shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5E6F63]" />
            <input
              type="text"
              placeholder="Filter by asset name, corridor or ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E4E0D6] bg-[#F6F4EF]/70 text-[#26302A] placeholder:text-[#A3AD9C] focus:bg-white focus:border-[#5E6F63] outline-none transition font-sans"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="py-2 px-3 rounded-xl border border-[#E4E0D6] text-xs bg-[#F6F4EF]/70 text-[#26302A] font-medium outline-none cursor-pointer hover:border-[#A3AD9C] transition"
          >
            <option value="all">All Asset Classes</option>
            <option value="road">🛣️ Roads & Expressways</option>
            <option value="bus_stop">🚏 Bus Transit Shelters</option>
            <option value="footpath">🚶 Pedestrian Corridors</option>
            <option value="overbridge">🌉 Pedestrian Overbridges</option>
          </select>

          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="py-2 px-3 rounded-xl border border-[#E4E0D6] text-xs bg-[#F6F4EF]/70 text-[#26302A] font-medium outline-none cursor-pointer hover:border-[#A3AD9C] transition"
          >
            <option value="all">All Municipal Wards</option>
            {authorities.map((auth) => (
              <option key={auth.id} value={auth.id}>
                {auth.ward_name} ({auth.department_name})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#5E6F63]">
            Reading Supabase Asset Registry...
          </p>
        </div>
      ) : filteredAssets.length === 0 ? (
        /* Serene Empty State */
        <Card className="p-12 text-center bg-white/70 backdrop-blur-sm border border-[#E4E0D6] shadow-sm space-y-4">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-2xl bg-[#F6F4EF] border border-[#E4E0D6]">
            <StillPointLogo size={36} variant="minimal" color="#5E6F63" irisColor="#C58A66" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-[#26302A]">No Infrastructure Assets Listed</h3>
            <p className="text-xs text-[#5E6F63] max-w-sm mx-auto leading-relaxed">
              {searchQuery || selectedType !== 'all' || selectedWard !== 'all'
                ? 'No assets match your search filters. Try clearing the query to view all cataloged infrastructure.'
                : 'The public database currently has no registered municipal assets. Citizen defect reports create new verified points.'}
            </p>
          </div>
          <div className="pt-2">
            <Link href="/user/report">
              <Button size="sm" className="bg-[#26302A] text-[#F6F4EF]">
                <PlusCircle className="h-4 w-4 mr-1.5 text-[#C58A66]" />
                <span>Submit Field Report</span>
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* Asset Directory Cards */
        <div className="space-y-3">
          {filteredAssets.map((asset) => {
            const linkedIssue = issues.find((i) => i.asset_id === asset.id);
            const isExpanded = expandedAssetId === asset.id;
            const score = asset.condition_score ?? 100;
            const scoreColor =
              score > 70
                ? 'bg-[#5E6F63]'
                : score > 40
                ? 'bg-[#C58A66]'
                : 'bg-[#A84835]';

            return (
              <Card
                key={asset.id}
                className="overflow-hidden border border-[#E4E0D6] bg-white/80 backdrop-blur-xs shadow-2xs hover:border-[#A3AD9C] transition"
              >
                <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className="p-2.5 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] text-slate-700 text-lg shrink-0">
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
                        <span className="text-[10px] font-mono font-bold text-[#A3AD9C]">
                          #{asset.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-[#E4E0D6] text-[#5E6F63]">
                          {asset.asset_type.replace('_', ' ')}
                        </span>
                        {linkedIssue && (
                          <StatusBadge status={linkedIssue.status} />
                        )}
                      </div>

                      <h3
                        className="text-sm sm:text-base font-serif font-bold text-[#26302A] hover:text-[#C58A66] transition cursor-pointer"
                        onClick={() => openSlideOver(asset)}
                      >
                        {asset.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#5E6F63] pt-0.5 font-sans">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-[#A3AD9C]" />
                          {asset.authority?.ward_name || 'Municipal Ward'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <MapPin className="h-3.5 w-3.5 text-[#A3AD9C]" />
                          {asset.lat ? `${asset.lat.toFixed(4)}° N, ${asset.lng?.toFixed(4)}° E` : 'Geom Registered'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Metrics: Condition Score & Actions */}
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[#E4E0D6]">
                    {/* Condition Progress Bar */}
                    <div className="text-right min-w-[120px]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#5E6F63] text-[11px] font-mono">Condition:</span>
                        <strong className="text-[#26302A] font-mono font-bold">{score} / 100</strong>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#E4E0D6] overflow-hidden">
                        <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${score}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSlideOver(asset)}
                        className="text-xs py-1.5 px-3 border-[#E4E0D6] text-[#26302A] hover:bg-[#E4E0D6]/40"
                      >
                        <span>Details</span>
                      </Button>

                      {linkedIssue && linkedIssue.status_updates && linkedIssue.status_updates.length > 0 && (
                        <button
                          onClick={() => toggleExpand(asset.id)}
                          className="p-1.5 rounded-lg text-[#5E6F63] hover:text-[#26302A] hover:bg-[#E4E0D6]/50 transition cursor-pointer"
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
                  <div className="px-5 py-4 bg-[#F6F4EF] border-t border-[#E4E0D6] space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#26302A]">
                      <History className="h-3.5 w-3.5 text-[#C58A66]" />
                      <span>Chronological Audit Trail for #{linkedIssue.id.slice(0, 8)}</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {linkedIssue.status_updates.map((update) => (
                        <div
                          key={update.id}
                          className="p-3 rounded-xl bg-white border border-[#E4E0D6] flex items-start justify-between gap-4 shadow-2xs"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-[#26302A]">{update.new_status}</span>
                              {update.audit_verdict && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#5E6F63]/15 text-[#5E6F63]">
                                  AI Audit: {update.audit_verdict} ({((update.audit_confidence || 0.95) * 100).toFixed(0)}%)
                                </span>
                              )}
                            </div>
                            <p className="text-[#5E6F63]">{update.notes}</p>
                          </div>
                          <span className="text-[10px] text-[#A3AD9C] font-mono shrink-0">
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
      )}
    </div>
  );
}
