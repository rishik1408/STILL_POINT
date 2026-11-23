'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  MapPin,
  Building2,
  HardHat,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import { Button, Card, Spinner, Badge } from '@/components/ui/shared';
import { MOCK_ASSETS, MOCK_ISSUES, MOCK_AUTHORITIES } from '@/lib/mock-data';
import { AssetDetailSlideOver } from '@/components/map/AssetDetailSlideOver';
import { Asset, Issue } from '@/types';

const DynamicMapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-100 rounded-2xl">
      <Spinner size="lg" />
      <p className="mt-3 text-xs font-semibold text-slate-500">Loading Ward Dispatch Geometry...</p>
    </div>
  ),
});

export default function OfficialMapPage() {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);

  const ward = MOCK_AUTHORITIES[0];

  // Filter strictly to Ward A or show all with ward highlighted
  const wardAssets = MOCK_ASSETS.filter((a) => a.authority_id === ward.id);
  const wardIssues = MOCK_ISSUES.filter((i) => i.authority_id === ward.id);

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setSelectedAsset(issue.asset || null);
    setSlideOverOpen(true);
  };

  const handleSelectAsset = (asset: Asset) => {
    const matching = MOCK_ISSUES.find((i) => i.asset_id === asset.id);
    setSelectedIssue(matching || null);
    setSelectedAsset(asset);
    setSlideOverOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 h-full flex flex-col">
      <AssetDetailSlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        issue={selectedIssue}
        asset={selectedAsset}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/official" className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Dashboard
            </Link>
            <span className="text-slate-300">•</span>
            <Badge variant="blue" size="sm">{ward.ward_name}</Badge>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Ward Crew Dispatch Map
          </h1>
          <p className="text-xs text-slate-500">
            Geospatial visualization of active maintenance work-orders within your assigned municipal polygon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">
            <strong>{wardIssues.length}</strong> Ward Tickets • <strong>{wardAssets.length}</strong> Registered Assets
          </span>
        </div>
      </div>

      {/* Map view container */}
      <div className="flex-1 min-h-[550px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
        <DynamicMapView
          assets={wardAssets}
          issues={wardIssues}
          authorities={[ward]}
          selectedIssueId={selectedIssue?.id}
          onSelectIssue={handleSelectIssue}
          onSelectAsset={handleSelectAsset}
          center={[18.9220, 72.8330]}
          zoom={14}
        />
      </div>
    </div>
  );
}
