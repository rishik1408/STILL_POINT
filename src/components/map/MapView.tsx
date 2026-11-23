'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Asset, Issue, Authority } from '@/types';
import { SEVERITY_CONFIG } from '@/lib/constants';

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
  const emoji =
    assetType === 'road'
      ? '🛣️'
      : assetType === 'bus_stop'
      ? '🚏'
      : assetType === 'footpath'
      ? '🚶'
      : '🌉';

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
      font-family: system-ui, sans-serif;
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
  center = [19.076, 72.8777],
  zoom = 12,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map instance
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers/polygons except tile layers
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Draw municipal ward polygons
    authorities.forEach((auth) => {
      const poly = auth.ward_polygon as { coordinates?: number[][][] };
      if (!poly?.coordinates?.[0]) return;

      const positions: [number, number][] = poly.coordinates[0].map(([lng, lat]) => [
        lat,
        lng,
      ]);

      const polygon = L.polygon(positions, {
        color: '#1D4ED8',
        weight: 1.5,
        fillColor: '#3B82F6',
        fillOpacity: 0.08,
        dashArray: '4, 4',
      }).addTo(map);

      polygon.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 2px;">
          <strong style="color: #0F172A; display: block; font-size: 13px;">${auth.ward_name}</strong>
          <span style="color: #475569; display: block; margin-top: 2px;">${auth.department_name}</span>
          <span style="color: #64748B; font-size: 11px; display: block; margin-top: 4px;">Contact: ${auth.contact_name}</span>
          <a href="mailto:${auth.email}" style="color: #1D4ED8; font-size: 11px; text-decoration: underline; margin-top: 2px; display: block;">${auth.email}</a>
        </div>
      `);
    });

    // Draw Asset markers
    assets.forEach((asset) => {
      const lat =
        asset.lat || (asset.geom as { coordinates?: number[] })?.coordinates?.[1];
      const lng =
        asset.lng || (asset.geom as { coordinates?: number[] })?.coordinates?.[0];
      if (!lat || !lng) return;

      const marker = L.marker([lat, lng], {
        icon: createAssetIcon(asset.asset_type, asset.condition_score),
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #0F172A; font-size: 13px;">${asset.name}</strong>
            <span style="background: #F1F5F9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">${asset.asset_type}</span>
          </div>
          <div style="color: #64748B; font-size: 12px; margin-bottom: 6px;">Condition Score: <strong style="color: #0F172A;">${asset.condition_score} / 100</strong></div>
        </div>
      `);

      marker.on('click', () => {
        onSelectAsset?.(asset);
      });
    });

    // Draw Issue markers
    issues.forEach((issue) => {
      const lat = issue.asset?.lat || 18.922;
      const lng = issue.asset?.lng || 72.833;

      const marker = L.marker([lat, lng], {
        icon: createIssueIcon(issue.severity, issue.status),
      }).addTo(map);

      const summary =
        issue.human_final_json?.technical_summary ||
        issue.ai_raw_json?.technical_summary ||
        '';

      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 12px; min-width: 180px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #0F172A; font-size: 13px;">${issue.category}</strong>
            <span style="background: #DBEAFE; color: #1E40AF; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">S${issue.severity}</span>
          </div>
          <p style="color: #475569; font-size: 11px; margin-bottom: 6px; line-height: 1.3;">${summary.slice(0, 80)}...</p>
          <div style="font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 4px;">Status: <strong style="color: #0F172A;">${issue.status}</strong></div>
        </div>
      `);

      marker.on('click', () => {
        onSelectIssue?.(issue);
      });
    });

    // Clean up on unmount
    return () => {
      // Keep instance cached
    };
  }, [assets, issues, authorities, center, zoom, onSelectAsset, onSelectIssue]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full min-h-[500px] rounded-2xl z-10"
      style={{ height: '100%', width: '100%' }}
    />
  );
}
