'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Filter,
  PlusCircle,
  MapPin,
  Layers,
  Search,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Button, Badge, Card, Spinner } from '@/components/ui/shared';
import { AssetDetailSlideOver } from '@/components/map/AssetDetailSlideOver';
import { MOCK_ASSETS, MOCK_ISSUES, MOCK_AUTHORITIES } from '@/lib/mock-data';
import { Asset, Issue } from '@/types';
import { DEFECT_CATEGORIES } from '@/lib/constants';

// Dynamically import MapView with SSR disabled
const DynamicMapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-100 rounded-2xl">
      <Spinner size="lg" />
      <p className="mt-3 text-xs font-semibold text-slate-500">Loading Geospatial Infrastructure Map...</p>
    </div>
  ),
});

export default function UserMapPage() {
  const [selectedAssetType, setSelectedAssetType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return MOCK_ISSUES.filter((issue) => {
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
  }, [selectedSeverity, selectedStatus, selectedAssetType, searchQuery]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return MOCK_ASSETS.filter((asset) => {
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
  }, [selectedAssetType, searchQuery]);

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setSelectedAsset(issue.asset || null);
    setSlideOverOpen(true);
  };

  const handleSelectAsset = (asset: Asset) => {
    // Find matching issue if exists
    const matchingIssue = MOCK_ISSUES.find((i) => i.asset_id === asset.id);
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
    <div className="h-full flex flex-col p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1B365D] tracking-tight">
            Live Civic Infrastructure Map
          </h1>
          <p className="text-xs text-slate-500">
            Real-time public defect mapping, severity classification, and municipal ward routing.
          </p>
        </div>

        <Link href="/user/report">
          <Button size="sm" className="flex items-center gap-2 shadow-md">
            <PlusCircle className="h-4 w-4" />
            <span>Report New Defect</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3 bg-white shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search roads, wards, or defect types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Asset Type Filter */}
          <select
            value={selectedAssetType}
            onChange={(e) => setSelectedAssetType(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-medium outline-none cursor-pointer"
          >
            <option value="all">All Assets (Roads/Bridges)</option>
            <option value="road">🛣️ Roads Only</option>
            <option value="bus_stop">🚏 Bus Stops Only</option>
            <option value="footpath">🚶 Footpaths Only</option>
            <option value="overbridge">🌉 Overbridges Only</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-medium outline-none cursor-pointer"
          >
            <option value="all">All Severities (1–4)</option>
            <option value="4">S4: Critical Hazard</option>
            <option value="3">S3: High Severity</option>
            <option value="2">S2: Medium Severity</option>
            <option value="1">S1: Low Severity</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-medium outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="In Progress">In Progress</option>
            <option value="Repair Claimed">Repair Claimed</option>
            <option value="Escalated">Escalated</option>
            <option value="Verified Closed">Verified Closed</option>
          </select>

          {(selectedAssetType !== 'all' || selectedSeverity !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={resetFilters}
              className="p-1.5 text-xs text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 flex items-center gap-1 transition"
              title="Reset Filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </Card>

      {/* Map Stats & Legend Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-3 text-slate-600">
          <span>Showing <strong>{filteredIssues.length}</strong> active issues & <strong>{filteredAssets.length}</strong> monitored assets</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="hidden sm:inline text-blue-600">Blue dashed lines = Municipal Ward Polygons</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" /> S4 Critical
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500 inline-block" /> S3 High
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" /> S2 Med
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> Verified Closed
          </span>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <div className="flex-1 min-h-[550px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
        <DynamicMapView
          assets={filteredAssets}
          issues={filteredIssues}
          authorities={MOCK_AUTHORITIES}
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
