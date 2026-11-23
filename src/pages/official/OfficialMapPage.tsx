import { useState, useEffect } from 'react';
import { MapView } from '@/components/map/MapView';
import { AssetDetailSlideOver } from '@/components/map/AssetDetailSlideOver';
import { fetchAssets, fetchIssues, fetchAuthorities } from '@/lib/data-service';
import { Asset, Issue, Authority } from '@/types';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/shared';
import { MAP_DEFAULT_CENTER } from '@/lib/constants';

export function OfficialMapPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [a, i, auths] = await Promise.all([
        fetchAssets(),
        fetchIssues(),
        fetchAuthorities(),
      ]);
      setAssets(a);
      setIssues(i);
      setAuthorities(auths);
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-[#EDE9E0] p-6 rounded-2xl border border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#26302A]">
            Ward Dispatch & Field Crew Map
          </h1>
          <p className="text-sm text-[#5E6F63] mt-1">
            BBMP Bengaluru spatial zone boundaries with live status of reported vs. resolved tickets.
          </p>
        </div>
        <Button
          variant="stone"
          size="sm"
          onClick={loadData}
          loading={loading}
          className="border-[#E4E0D6]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Pins</span>
        </Button>
      </div>

      <div className="bg-[#EDE9E0] p-4 sm:p-6 rounded-2xl border border-[#E4E0D6]">
        <div className="h-[620px] rounded-xl overflow-hidden border border-[#E4E0D6]">
          <MapView
            issues={issues}
            assets={assets}
            authorities={authorities}
            center={MAP_DEFAULT_CENTER}
            zoom={12}
            onSelectIssue={(issue: Issue) => {
              setSelectedIssue(issue);
              setSelectedAsset(issue.asset || null);
              setIsSlideOverOpen(true);
            }}
            onSelectAsset={(asset: Asset) => {
              setSelectedAsset(asset);
              setSelectedIssue(null);
              setIsSlideOverOpen(true);
            }}
          />
        </div>
      </div>

      <AssetDetailSlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        issue={selectedIssue}
        asset={selectedAsset}
      />
    </div>
  );
}
