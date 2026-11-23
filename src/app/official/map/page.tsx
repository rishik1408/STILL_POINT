'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  MapPin,
  Building2,
  HardHat,
  ArrowLeft,
} from 'lucide-react';
import { Button, Card, Spinner, Badge } from '@/components/ui/shared';
import { fetchAssets, fetchIssues, fetchAuthorities } from '@/lib/data-service';
import { AssetDetailSlideOver } from '@/components/map/AssetDetailSlideOver';
import { Asset, Issue, Authority } from '@/types';

const DynamicMapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#E4E0D6]/20 border border-[#E4E0D6] rounded-2xl">
      <Spinner size="lg" />
      <p className="mt-3 text-xs font-mono uppercase tracking-widest text-[#5E6F63]">
        Loading Ward Dispatch Geometry...
      </p>
    </div>
  ),
});

export default function OfficialMapPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadOfficialMapData() {
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
        console.error('Failed to load official map data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadOfficialMapData();
    return () => {
      isMounted = false;
    };
  }, []);

  const ward = authorities[0] || {
    id: 'ward-a',
    ward_name: 'Ward A — Colaba & Fort',
    department_name: 'Municipal Engineering Operations',
  };

  // Filter to active ward if authority_id matches, or show all when limited
  const wardAssets = assets.filter((a) => !a.authority_id || a.authority_id === ward.id || assets.length <= 5);
  const wardIssues = issues.filter((i) => !i.authority_id || i.authority_id === ward.id || issues.length <= 5);

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setSelectedAsset(issue.asset || null);
    setSlideOverOpen(true);
  };

  const handleSelectAsset = (asset: Asset) => {
    const matching = issues.find((i) => i.asset_id === asset.id);
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
            <Link
              href="/official"
              className="text-xs font-mono font-bold text-[#C58A66] hover:text-[#B85D36] flex items-center gap-1 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Desk Overview
            </Link>
            <span className="text-[#E4E0D6]">•</span>
            <Badge variant="clay" size="sm">{ward.ward_name}</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#26302A] tracking-tight">
            Ward Crew Dispatch Map
          </h1>
          <p className="text-xs text-[#5E6F63] mt-0.5">
            Geospatial visualization of active maintenance work-orders within your assigned municipal polygon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#5E6F63]">
            <strong className="text-[#26302A] font-bold">{wardIssues.length}</strong> Ward Orders •{' '}
            <strong className="text-[#26302A] font-bold">{wardAssets.length}</strong> Registered Assets
          </span>
        </div>
      </div>

      {/* Map view container */}
      <div className="flex-1 min-h-[550px] rounded-2xl overflow-hidden border border-[#E4E0D6] shadow-sm relative bg-[#E4E0D6]/20">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F6F4EF]/85 backdrop-blur-xs z-10">
            <Spinner size="lg" />
            <p className="mt-3 text-xs font-mono uppercase tracking-widest text-[#5E6F63]">
              Loading Ward Dispatch Geometry...
            </p>
          </div>
        ) : null}
        <DynamicMapView
          assets={wardAssets}
          issues={wardIssues}
          authorities={authorities}
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
