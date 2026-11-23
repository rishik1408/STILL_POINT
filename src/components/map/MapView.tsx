'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Asset, Issue, Authority } from '@/types';
import { SEVERITY_CONFIG, STATUS_CONFIG } from '@/lib/constants';
import { Badge, Button } from '@/components/ui/shared';
import { AlertTriangle, Clock, MapPin, Eye } from 'lucide-react';

// Fix for default Leaflet icon paths in Next.js bundler
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG marker factory for Issues based on severity
function createIssueIcon(severity: number, status: string) {
  const color = SEVERITY_CONFIG[severity as 1 | 2 | 3 | 4]?.color || '#3B82F6';
  const isCritical = severity === 4;
  const isClosed = status === 'Verified Closed';

  const html = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      ${
        isCritical && !isClosed
          ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: ${color}; opacity: 0.25; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
          : ''
      }
      <div style="
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: ${isClosed ? '#15803D' : color};
        border: 3px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 800;
        font-size: 12px;
        font-family: system-ui, sans-serif;
      ">
        ${isClosed ? '✓' : `S${severity}`}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-issue-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
}

// Custom SVG marker for Assets
function createAssetIcon(assetType: string, conditionScore: number) {
  const color = conditionScore > 70 ? '#15803D' : conditionScore > 40 ? '#D97706' : '#DC2626';
  const emoji = assetType === 'road' ? '🛣️' : assetType === 'bus_stop' ? '🚏' : assetType === 'footpath' ? '🚶' : '🌉';

  const html = `
    <div style="
      background: white;
      border: 2px solid ${color};
      border-radius: 8px;
      padding: 3px 5px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 3px;
      font-family: system-ui;
    ">
      <span>${emoji}</span>
      <span style="font-weight: bold; font-size: 10px; color: ${color};">${conditionScore}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-asset-marker',
    iconSize: [40, 24],
    iconAnchor: [20, 12],
    popupAnchor: [0, -12],
  });
}

interface MapViewProps {
  assets: Asset[];
  issues: Issue[];
  authorities?: Authority[];
  selectedIssueId?: string | null;
  onSelectIssue?: (issue: Issue) => void;
  onSelectAsset?: (asset: Asset) => void;
  center?: [number, number];
  zoom?: number;
}

export default function MapView({
  assets,
  issues,
  authorities = [],
  onSelectIssue,
  onSelectAsset,
  center = [19.0760, 72.8777],
  zoom = 12,
}: MapViewProps) {
  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ minHeight: '500px', height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Municipal Ward Polygons */}
        {authorities.map((auth) => {
          const poly = auth.ward_polygon as { coordinates?: number[][][] };
          if (!poly?.coordinates?.[0]) return null;

          // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
          const positions: [number, number][] = poly.coordinates[0].map(([lng, lat]) => [lat, lng]);

          return (
            <Polygon
              key={auth.id}
              positions={positions}
              pathOptions={{
                color: '#1D4ED8',
                weight: 1.5,
                fillColor: '#3B82F6',
                fillOpacity: 0.08,
                dashArray: '4, 4',
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <p className="font-bold text-slate-900">{auth.ward_name}</p>
                  <p className="text-slate-600">{auth.department_name}</p>
                  <p className="text-slate-500">Contact: {auth.contact_name}</p>
                  <p className="text-blue-600">{auth.email}</p>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* Infrastructure Asset Markers */}
        {assets.map((asset) => {
          const lat = asset.lat || (asset.geom as { coordinates?: number[] })?.coordinates?.[1];
          const lng = asset.lng || (asset.geom as { coordinates?: number[] })?.coordinates?.[0];
          if (!lat || !lng) return null;

          return (
            <Marker
              key={asset.id}
              position={[lat, lng]}
              icon={createAssetIcon(asset.asset_type, asset.condition_score)}
              eventHandlers={{
                click: () => onSelectAsset?.(asset),
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{asset.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-semibold uppercase">
                      {asset.asset_type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Condition Score:</span>
                    <strong className="text-slate-900">{asset.condition_score} / 100</strong>
                  </div>
                  <button
                    onClick={() => onSelectAsset?.(asset)}
                    className="w-full mt-1 py-1 rounded bg-[#1B365D] text-white font-medium text-[11px] hover:bg-blue-900 transition"
                  >
                    View Asset History
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Reported Issues Markers */}
        {issues.map((issue) => {
          // Extract coordinates from issue location or linked asset
          const lat = issue.asset?.lat || 19.076;
          const lng = issue.asset?.lng || 72.877;

          return (
            <Marker
              key={issue.id}
              position={[lat, lng]}
              icon={createIssueIcon(issue.severity, issue.status)}
              eventHandlers={{
                click: () => onSelectIssue?.(issue),
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 text-xs min-w-[180px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{issue.category}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        SEVERITY_CONFIG[issue.severity as 1 | 2 | 3 | 4]?.bgColor || 'bg-blue-100'
                      } ${SEVERITY_CONFIG[issue.severity as 1 | 2 | 3 | 4]?.textColor || 'text-blue-800'}`}
                    >
                      Severity {issue.severity}
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px] line-clamp-2">
                    {issue.human_final_json?.technical_summary || issue.ai_raw_json?.technical_summary || 'No summary'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Status:</span>
                    <strong className="text-slate-700">{issue.status}</strong>
                  </div>

                  <button
                    onClick={() => onSelectIssue?.(issue)}
                    className="w-full py-1.5 rounded-lg bg-[#1D4ED8] text-white font-semibold text-[11px] hover:bg-blue-800 transition flex items-center justify-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    <span>View Inspection Detail</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
