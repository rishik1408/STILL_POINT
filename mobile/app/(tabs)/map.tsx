// ============================================================
// STILL POINT Mobile — Tab 1: Interactive Sanctuary Map
// Mirrors src/app/user/map/page.tsx & src/components/map/MapView.tsx
// Full-viewport Leaflet WebView with postMessage -> native bottom sheet.
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import {
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react-native';
import { AssetDetailSheet } from '@/components/AssetDetailSheet';
import {
  fetchAssets,
  fetchAuthorities,
  fetchIssues,
} from '@/lib/data-service';
import {
  buildLeafletMapHtml,
  serializeMapData,
} from '@/lib/leaflet-map-html';
import {
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  RADII,
  SEVERITY_CONFIG,
  SPACING,
} from '@/theme/tokens';
import { Asset, Authority, Issue } from '@/types';

const SEVERITY_PILLS = [
  { key: 'all', label: 'All Sev' },
  { key: '4', label: 'S4 Critical' },
  { key: '3', label: 'S3 High' },
  { key: '2', label: 'S2 Med' },
  { key: '1', label: 'S1 Low' },
];

const ASSET_TYPE_PILLS = [
  { key: 'all', label: 'All Assets' },
  { key: 'road', label: '🛣️ Roads' },
  { key: 'bus_stop', label: '🚏 Bus Stops' },
  { key: 'footpath', label: '🚶 Footpaths' },
  { key: 'overbridge', label: '🌉 Bridges' },
];

export default function CitizenMapScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView<Record<string, unknown>> | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const mapHtml = useMemo(() => buildLeafletMapHtml(), []);

  const loadMapData = useCallback(async () => {
    try {
      setLoading(true);
      const [loadedAssets, loadedIssues, loadedAuths] = await Promise.all([
        fetchAssets(),
        fetchIssues(),
        fetchAuthorities(),
      ]);
      setAssets(loadedAssets);
      setIssues(loadedIssues);
      setAuthorities(loadedAuths);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (selectedSeverity !== 'all' && String(issue.severity) !== selectedSeverity) {
        return false;
      }
      if (selectedAssetType !== 'all' && issue.asset?.asset_type !== selectedAssetType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = issue.asset?.name.toLowerCase().includes(q);
        const matchesCategory = issue.category.toLowerCase().includes(q);
        const matchesWard = issue.authority?.ward_name.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesWard) return false;
      }
      return true;
    });
  }, [issues, selectedSeverity, selectedAssetType, searchQuery]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (selectedAssetType !== 'all' && asset.asset_type !== selectedAssetType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          asset.name.toLowerCase().includes(q) ||
          Boolean(asset.authority?.ward_name?.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [assets, selectedAssetType, searchQuery]);

  // Push filtered GIS layers into Leaflet WebView whenever ready or filters change
  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;
    const payload = serializeMapData(filteredAssets, filteredIssues, authorities);
    const script = `window.updateStillPointMap && window.updateStillPointMap(${JSON.stringify(payload)}); true;`;
    webViewRef.current.injectJavaScript(script);
  }, [mapReady, filteredAssets, filteredIssues, authorities]);

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as {
        type: 'map_ready' | 'select_issue' | 'select_asset';
        id?: string;
      };

      if (msg.type === 'map_ready') {
        setMapReady(true);
        return;
      }

      if (msg.type === 'select_issue' && msg.id) {
        const found = issues.find((i) => i.id === msg.id) || null;
        if (found) {
          setSelectedIssue(found);
          setSelectedAsset(found.asset || null);
          setSheetVisible(true);
        }
        return;
      }

      if (msg.type === 'select_asset' && msg.id) {
        const foundAsset = assets.find((a) => a.id === msg.id) || null;
        if (foundAsset) {
          const matchingIssue = issues.find((i) => i.asset_id === foundAsset.id) || null;
          setSelectedAsset(foundAsset);
          setSelectedIssue(matchingIssue);
          setSheetVisible(true);
        }
      }
    } catch {
      // Ignore malformed bridge messages
    }
  };

  const hasFilters =
    selectedAssetType !== 'all' || selectedSeverity !== 'all' || Boolean(searchQuery.trim());

  const resetFilters = () => {
    setSelectedAssetType('all');
    setSelectedSeverity('all');
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      {/* Compact Search & Filter Bar */}
      <View style={styles.controlsPanel}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Search size={15} color={COLORS.moss} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search corridors, wards, defects..."
              placeholderTextColor={COLORS.sage}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Pressable
            onPress={loadMapData}
            style={styles.iconAction}
            accessibilityLabel="Refresh map data"
          >
            <RefreshCw size={16} color={COLORS.bark} />
          </Pressable>
          {hasFilters ? (
            <Pressable
              onPress={resetFilters}
              style={styles.iconAction}
              accessibilityLabel="Reset filters"
            >
              <RotateCcw size={16} color={COLORS.clay} />
            </Pressable>
          ) : null}
        </View>

        {/* Horizontal Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {SEVERITY_PILLS.map((p) => {
            const active = selectedSeverity === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => setSelectedSeverity(p.key)}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
          <View style={styles.pillDivider} />
          {ASSET_TYPE_PILLS.map((p) => {
            const active = selectedAssetType === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => setSelectedAssetType(p.key)}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Live Counts & Legend */}
        <View style={styles.statsStrip}>
          <Text style={styles.statsText}>
            <Text style={styles.statsStrong}>{filteredIssues.length}</Text> tickets ·{' '}
            <Text style={styles.statsStrong}>{filteredAssets.length}</Text> assets
          </Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SEVERITY_CONFIG[4].color }]} />
              <Text style={styles.legendLabel}>S4</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SEVERITY_CONFIG[3].color }]} />
              <Text style={styles.legendLabel}>S3</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SEVERITY_CONFIG[2].color }]} />
              <Text style={styles.legendLabel}>S2</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.mapClosed }]} />
              <Text style={styles.legendLabel}>Closed</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Full-Viewport Leaflet Map WebView */}
      <View style={styles.mapContainer}>
        <WebView<Record<string, unknown>>
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          style={styles.webview}
        />

        {loading ? (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <View style={styles.loadingBadge}>
              <ActivityIndicator size="small" color={COLORS.clay} />
              <Text style={styles.loadingBadgeText}>SYNCING GIS LAYER...</Text>
            </View>
          </View>
        ) : null}

        {/* Floating Quick Report Button */}
        <Pressable
          onPress={() => router.push('/(tabs)/report')}
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
        >
          <PlusCircle size={18} color={COLORS.clay} />
          <Text style={styles.fabText}>Report Defect</Text>
        </Pressable>
      </View>

      {/* Native Bottom Sheet on Pin Tap */}
      <AssetDetailSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        issue={selectedIssue}
        asset={selectedAsset}
        onReportNearby={() => router.push('/(tabs)/report')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.stone,
  },
  controlsPanel: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.linen,
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.stone,
    borderWidth: 1,
    borderColor: COLORS.linen,
    borderRadius: RADII.md,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.bark,
    paddingVertical: 0,
  },
  iconAction: {
    width: 38,
    height: 38,
    borderRadius: RADII.md,
    backgroundColor: COLORS.stone,
    borderWidth: 1,
    borderColor: COLORS.linen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.full,
    backgroundColor: COLORS.stone,
    borderWidth: 1,
    borderColor: COLORS.linen,
  },
  pillActive: {
    backgroundColor: COLORS.bark,
    borderColor: COLORS.bark,
  },
  pillText: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.moss,
  },
  pillTextActive: {
    color: COLORS.stone,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  pillDivider: {
    width: 1,
    height: 18,
    backgroundColor: COLORS.linen,
    marginHorizontal: 2,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  statsText: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
  },
  statsStrong: {
    fontFamily: FONT_FAMILIES.mono,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    color: COLORS.bark,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.stone,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
  },
  loadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(246, 244, 239, 0.94)',
    borderWidth: 1,
    borderColor: COLORS.linen,
    borderRadius: RADII.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  loadingBadgeText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.moss,
    letterSpacing: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: COLORS.barkLight,
    elevation: 5,
    shadowColor: COLORS.bark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabText: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.stone,
  },
});
