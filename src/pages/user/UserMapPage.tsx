import { useState, useEffect } from 'react';
import { MapView } from '@/components/map/MapView';
import { AssetDetailSlideOver } from '@/components/map/AssetDetailSlideOver';
import { fetchAssets, fetchIssues, fetchAuthorities } from '@/lib/data-service';
import { Asset, Issue, Authority } from '@/types';
import { Filter, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/shared';
import { MAP_DEFAULT_CENTER } from '@/lib/constants';

export function UserMapPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedAssets, fetchedIssues, fetchedAuthorities] = await Promise.all([
        fetchAssets(),
        fetchIssues(),
        fetchAuthorities(),
      ]);
      setAssets(fetchedAssets);
      setIssues(fetchedIssues);
      setAuthorities(fetchedAuthorities);
    } catch (err) {
      console.error('Error loading map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setSelectedAsset(issue.asset || null);
    setIsSlideOverOpen(true);
  };

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setSelectedIssue(null);
    setIsSlideOverOpen(true);
  };

  // Filtered issues
  const filteredIssues = issues.filter((issue) => {
    if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
    if (severityFilter !== 'all' && issue.severity.toString() !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#EDE9E0] p-6 rounded-2xl border border-[#E4E0D6]">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#26302A]">
            Infrastructure Spatial Map
          </h1>
          <p className="text-sm text-[#5E6F63] mt-1">
            Real-time visual monitoring of municipal road, transit, and footpath assets across PostGIS wards.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#F6F4EF] px-3 py-1.5 rounded-xl border border-[#E4E0D6] text-xs font-medium text-[#26302A]">
            <Filter className="w-3.5 h-3.5 text-[#C58A66]" />
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Defects</option>
              <option value="Pothole">Potholes</option>
              <option value="Broken Footpath Slab">Footpath Slabs</option>
              <option value="Damaged Bus Shelter">Bus Shelters</option>
              <option value="Missing Railing">Overbridge Railings</option>
              <option value="Drainage Blockage">Drainage</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F6F4EF] px-3 py-1.5 rounded-xl border border-[#E4E0D6] text-xs font-medium text-[#26302A]">
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="4">S4 (Critical)</option>
              <option value="3">S3 (High)</option>
              <option value="2">S2 (Medium)</option>
              <option value="1">S1 (Low)</option>
            </select>
          </div>

          <Button
            variant="stone"
            size="sm"
            onClick={loadData}
            loading={loading}
            className="border-[#E4E0D6] text-[#26302A]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Map Card */}
      <div className="bg-[#EDE9E0] p-4 sm:p-6 rounded-2xl border border-[#E4E0D6] shadow-sm">
        {/* Map Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-[#E4E0D6] text-xs text-[#5E6F63]">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-[#26302A]">Severity Pins:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#A84835]"></span> S4 Critical
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#B85D36]"></span> S3 High
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#C58A66]"></span> S2 Medium
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#5E6F63]"></span> S1 Low
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#15803D]"></span> ✓ Resolved
            </span>
          </div>

          <div className="text-xs font-medium text-[#26302A]">
            Showing {filteredIssues.length} issues across {assets.length} municipal assets
          </div>
        </div>

        {/* Leaflet Map Frame */}
        <div className="h-[620px] rounded-xl overflow-hidden border border-[#E4E0D6]">
          <MapView
            issues={filteredIssues}
            assets={assets}
            authorities={authorities}
            center={MAP_DEFAULT_CENTER}
            zoom={12}
            onSelectIssue={handleSelectIssue}
            onSelectAsset={handleSelectAsset}
            selectedIssueId={selectedIssue?.id}
          />
        </div>
      </div>

      {/* Slide Over Inspector */}
      <AssetDetailSlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        issue={selectedIssue}
        asset={selectedAsset}
      />
    </div>
  );
}
