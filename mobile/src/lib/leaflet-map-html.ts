// ============================================================
// STILL POINT Leaflet WebView HTML Generator
// Replicates src/components/map/MapView.tsx markers, pulsing
// critical-issue indicators, ward polygons, and postMessage bridge.
// Uses free OpenStreetMap / Carto tiles (zero Google Maps API keys).
// ============================================================

import { COLORS, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, SEVERITY_CONFIG } from '@/theme/tokens';
import { Asset, Authority, Issue } from '@/types';

export interface SerializedMapPayload {
  assets: Array<{
    id: string;
    name: string;
    asset_type: string;
    condition_score: number;
    lat: number;
    lng: number;
  }>;
  issues: Array<{
    id: string;
    category: string;
    severity: number;
    status: string;
    lat: number;
    lng: number;
  }>;
  authorities: Array<{
    id: string;
    ward_name: string;
    department_name: string;
    positions: [number, number][];
  }>;
}

export function serializeMapData(
  assets: Asset[],
  issues: Issue[],
  authorities: Authority[]
): SerializedMapPayload {
  const serializedAssets = assets
    .map((asset) => {
      const lat =
        asset.lat ?? (asset.geom as { coordinates?: number[] })?.coordinates?.[1];
      const lng =
        asset.lng ?? (asset.geom as { coordinates?: number[] })?.coordinates?.[0];
      if (typeof lat !== 'number' || typeof lng !== 'number') return null;
      return {
        id: asset.id,
        name: asset.name,
        asset_type: asset.asset_type,
        condition_score: asset.condition_score,
        lat,
        lng,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  const serializedIssues = issues.map((issue) => ({
    id: issue.id,
    category: issue.category,
    severity: issue.severity,
    status: issue.status,
    lat: issue.lat ?? issue.asset?.lat ?? 18.922,
    lng: issue.lng ?? issue.asset?.lng ?? 72.833,
  }));

  const serializedAuthorities = authorities
    .map((auth) => {
      const poly = auth.ward_polygon as { coordinates?: number[][][] } | null;
      if (!poly?.coordinates?.[0]) return null;
      const positions: [number, number][] = poly.coordinates[0].map(([lng, lat]) => [
        lat,
        lng,
      ]);
      return {
        id: auth.id,
        ward_name: auth.ward_name,
        department_name: auth.department_name,
        positions,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  return {
    assets: serializedAssets,
    issues: serializedIssues,
    authorities: serializedAuthorities,
  };
}

/**
 * Generates a self-contained Leaflet HTML document with exact Stone & Sage
 * severity markers, pulsing critical rings, and postMessage pin click bridge.
 */
export function buildLeafletMapHtml(
  center: [number, number] = MAP_DEFAULT_CENTER,
  zoom: number = MAP_DEFAULT_ZOOM
): string {
  const severityColorsJson = JSON.stringify({
    1: SEVERITY_CONFIG[1].color,
    2: SEVERITY_CONFIG[2].color,
    3: SEVERITY_CONFIG[3].color,
    4: SEVERITY_CONFIG[4].color,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: ${COLORS.stone};
      overflow: hidden;
    }
    .custom-issue-marker, .custom-asset-marker {
      background: transparent;
      border: none;
    }
    @keyframes sp-ping {
      0% { transform: scale(0.85); opacity: 0.7; }
      75%, 100% { transform: scale(1.65); opacity: 0; }
    }
    .sp-pulse {
      animation: sp-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    .leaflet-control-attribution {
      font-size: 9px !important;
      background: rgba(246, 244, 239, 0.85) !important;
      color: ${COLORS.moss} !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function () {
      var SEVERITY_COLORS = ${severityColorsJson};
      var map = L.map('map', { zoomControl: true }).setView([${center[0]}, ${center[1]}], ${zoom});

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map);

      var overlayGroup = L.layerGroup().addTo(map);

      function postToRN(payload) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function createIssueIcon(severity, status) {
        var color = SEVERITY_COLORS[severity] || '${COLORS.moss}';
        var isCritical = severity === 4;
        var isClosed = status === 'Verified Closed';
        var pulseRing = (isCritical && !isClosed)
          ? '<div class="sp-pulse" style="position:absolute;width:44px;height:44px;border-radius:50%;background:' + color + ';opacity:0.35;"></div>'
          : '';
        var pinSvg =
          '<div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">' +
            pulseRing +
            '<svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" style="position:relative;filter:drop-shadow(0 3px 6px rgba(38,48,42,0.35));">' +
              '<circle cx="17" cy="17" r="14" fill="' + (isClosed ? '${COLORS.mapClosed}' : color) + '" stroke="#FFFFFF" stroke-width="3" />' +
              '<text x="17" y="21" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="800" font-family="system-ui, sans-serif">' +
                (isClosed ? '✓' : 'S' + severity) +
              '</text>' +
            '</svg>' +
          '</div>';

        return L.divIcon({
          html: pinSvg,
          className: 'custom-issue-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
      }

      function createAssetIcon(assetType, conditionScore) {
        var color = conditionScore > 70 ? '${COLORS.mapConditionGood}' : conditionScore > 40 ? '${COLORS.mapConditionWarn}' : '${COLORS.mapConditionBad}';
        var emoji = assetType === 'road' ? '🛣️' : assetType === 'bus_stop' ? '🚏' : assetType === 'footpath' ? '🚶' : '🌉';
        var html =
          '<div style="background:#FFFFFF;border:2px solid ' + color + ';border-radius:8px;padding:2px 6px;box-shadow:0 2px 6px rgba(38,48,42,0.18);font-size:12px;display:inline-flex;align-items:center;gap:3px;font-family:system-ui,sans-serif;white-space:nowrap;">' +
            '<span>' + emoji + '</span>' +
            '<span style="font-weight:700;font-size:10px;color:' + color + ';">' + conditionScore + '</span>' +
          '</div>';

        return L.divIcon({
          html: html,
          className: 'custom-asset-marker',
          iconSize: [44, 24],
          iconAnchor: [22, 12]
        });
      }

      window.updateStillPointMap = function (data) {
        overlayGroup.clearLayers();
        if (!data) return;

        // 1. Ward Polygons (matching src/components/map/MapView.tsx)
        (data.authorities || []).forEach(function (auth) {
          if (!auth.positions || auth.positions.length < 3) return;
          L.polygon(auth.positions, {
            color: '${COLORS.wardStroke}',
            weight: 1.5,
            fillColor: '${COLORS.wardFill}',
            fillOpacity: 0.08,
            dashArray: '4, 4'
          }).addTo(overlayGroup);
        });

        // 2. Asset Markers
        (data.assets || []).forEach(function (asset) {
          var m = L.marker([asset.lat, asset.lng], {
            icon: createAssetIcon(asset.asset_type, asset.condition_score)
          }).addTo(overlayGroup);
          m.on('click', function () {
            postToRN({ type: 'select_asset', id: asset.id });
          });
        });

        // 3. Issue Markers
        (data.issues || []).forEach(function (issue) {
          var m = L.marker([issue.lat, issue.lng], {
            icon: createIssueIcon(issue.severity, issue.status)
          }).addTo(overlayGroup);
          m.on('click', function () {
            postToRN({ type: 'select_issue', id: issue.id });
          });
        });
      };

      postToRN({ type: 'map_ready' });
    })();
  </script>
</body>
</html>`;
}
