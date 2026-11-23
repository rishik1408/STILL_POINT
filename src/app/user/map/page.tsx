'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Filter,
  PlusCircle,
  MapPin,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Button, Badge, Card, Spinner } from '@/components/ui/shared';
import { AssetDetailSlideOver } from '@/components/map/AssetDetailSlideOver';
import { fetchAssets, fetchIssues, fetchAuthorities } from '@/lib/data-service';
import { Asset, Issue, Authority } from '@/types';

// Dynamically import MapView with SSR disabled
const DynamicMapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#E4E0D6]/20 border border-[#E4E0D6] rounded-2xl">
      <Spinner size="lg" />
      <p className="mt-3 text-xs font-mono uppercase tracking-widest text-[#5E6F63]">
        Loading Geospatial Sanctuary Map...
      </p>
    </div>
  ),
});

export default function UserMapPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedAssetType, setSelectedAssetType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadMapData() {
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
        console.error('Failed to load map data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadMapData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (selectedSeverity !== 'all' && issue.severity.toString() !== selectedSeverity) {
        return false;
      }
      if (selectedStatus !== 'all' && issue.status !== selectedStatus) {
        return false;
      }
      if (selectedAssetType !== 'all' && issue.asset?.asset_type !== selectedAssetType) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = issue.asset?.name.toLowerCase().includes(query);
        const matchesCategory = issue.category.toLowerCase().includes(query);
        const matchesWard = issue.authority?.ward_name.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory && !matchesWard) return false;
      }
      return true;
    });
  }, [issues, selectedSeverity, selectedStatus, selectedAssetType, searchQuery]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (selectedAssetType !== 'all' && asset.asset_type !== selectedAssetType) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          asset.name.toLowerCase().includes(query) ||
          asset.authority?.ward_name.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [assets, selectedAssetType, searchQuery]);

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setSelectedAsset(issue.asset || null);
    setSlideOverOpen(true);
  };

  const handleSelectAsset = (asset: Asset) => {
    const matchingIssue = issues.find((i) => i.asset_id === asset.id);
    setSelectedIssue(matchingIssue || null);
    setSelectedAsset(asset);
    setSlideOverOpen(true);
  };

  const resetFilters = () => {
    setSelectedAssetType('all');
    setSelectedSeverity('all');
    setSelectedStatus('all');
    setSearchQuery('');
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#5E6F63] font-semibold">
              Geospatial Intelligence
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C58A66]" />
            <span className="text-[10px] font-mono uppercase text-[#A3AD9C]">Live Field Mesh</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#26302A] tracking-tight">
            Civic Infrastructure Map
          </h1>
          <p className="text-xs text-[#5E6F63] mt-1 max-w-xl">
            Real-time public defect mapping, severity classification, and municipal ward routing across verified corridors.
          </p>
        </div>

        <Link href="/user/report">
          <Button size="sm" className="flex items-center gap-2 bg-[#26302A] hover:bg-[#34423a] text-[#F6F4EF] shadow-sm">
            <PlusCircle className="h-4 w-4 text-[#C58A66]" />
            <span>Report Defect</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#E4E0D6] shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5E6F63]" />
            <input
              type="text"
              placeholder="Search corridors, wards, or defect taxonomy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E4E0D6] bg-[#F6F4EF]/70 text-[#26302A] placeholder:text-[#A3AD9C] focus:bg-white focus:border-[#5E6F63] outline-none transition font-sans"
            />
          </div>

          {/* Asset Type Filter */}
          <select
            value={selectedAssetType}
            onChange={(e) => setSelectedAssetType(e.target.value)}
            className="py-2 px-3 rounded-xl border border-[#E4E0D6] text-xs bg-[#F6F4EF]/70 text-[#26302A] font-medium outline-none cursor-pointer hover:border-[#A3AD9C] transition"
          >
            <option value="all">All Asset Classes</option>
            <option value="road">🛣️ Roads & Expressways</option>
            <option value="bus_stop">🚏 Bus Transit Shelters</option>
            <option value="footpath">🚶 Pedestrian Corridors</option>
            <option value="overbridge">🌉 Bridges & Flyovers</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="py-2 px-3 rounded-xl border border-[#E4E0D6] text-xs bg-[#F6F4EF]/70 text-[#26302A] font-medium outline-none cursor-pointer hover:border-[#A3AD9C] transition"
          >
            <option value="all">All Severities (1–4)</option>
            <option value="4">S4: Critical Structural</option>
            <option value="3">S3: High Deterioration</option>
            <option value="2">S2: Medium Severity</option>
            <option value="1">S1: Low / Minor Wear</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 px-3 rounded-xl border border-[#E4E0D6] text-xs bg-[#F6F4EF]/70 text-[#26302A] font-medium outline-none cursor-pointer hover:border-[#A3AD9C] transition"
          >
            <option value="all">All Lifecycle States</option>
            <option value="Reported">Reported</option>
            <option value="In Progress">In Progress</option>
            <option value="Repair Claimed">Repair Claimed</option>
            <option value="Escalated">Escalated</option>
            <option value="Verified Closed">Verified Closed</option>
          </select>

          {(selectedAssetType !== 'all' || selectedSeverity !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={resetFilters}
              className="p-2 text-xs text-[#5E6F63] hover:text-[#26302A] rounded-xl hover:bg-[#E4E0D6]/50 flex items-center gap-1 transition"
              title="Reset Filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Map Stats & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        <div className="flex items-center gap-3 text-[#5E6F63]">
          <span>
            Displaying <strong className="text-[#26302A] font-mono">{filteredIssues.length}</strong> active tickets &{' '}
            <strong className="text-[#26302A] font-mono">{filteredAssets.length}</strong> monitored assets
          </span>
          <span className="hidden sm:inline text-[#E4E0D6]">|</span>
          <span className="hidden sm:inline text-[#5E6F63] font-mono text-[11px]">
            Dashed contours = Municipal Ward Polygons
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#26302A]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#A84835] inline-block shadow-2xs" /> S4 Critical
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#26302A]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#B85D36] inline-block shadow-2xs" /> S3 High
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#26302A]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C58A66] inline-block shadow-2xs" /> S2 Med
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#26302A]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#5E6F63] inline-block shadow-2xs" /> Verified Closed
          </span>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <div className="flex-1 min-h-[550px] rounded-2xl overflow-hidden border border-[#E4E0D6] shadow-sm relative bg-[#E4E0D6]/20">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F6F4EF]/80 backdrop-blur-xs z-10">
            <Spinner size="lg" />
            <p className="mt-3 text-xs font-mono uppercase tracking-widest text-[#5E6F63]">
              Synchronizing GIS Layer...
            </p>
          </div>
        ) : null}
        <DynamicMapView
          assets={filteredAssets}
          issues={filteredIssues}
          authorities={authorities}
          selectedIssueId={selectedIssue?.id}
          onSelectIssue={handleSelectIssue}
          onSelectAsset={handleSelectAsset}
        />
      </div>

      {/* Slide Over Details Panel */}
      <AssetDetailSlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        issue={selectedIssue}
        asset={selectedAsset}
      />
    </div>
  );
}
