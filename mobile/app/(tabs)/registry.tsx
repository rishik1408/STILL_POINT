// ============================================================
// STILL POINT Mobile — Tab 3: Civic Asset Registry
// Mirrors src/app/user/registry/page.tsx:
//   - Fetches assets & issues from Supabase
//   - Open / fixed defect counts per asset
//   - Category & status filter pills + search bar
//   - Expandable chronological audit trail + AssetDetailSheet
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  History,
  MapPin,
  PlusCircle,
  Search,
} from 'lucide-react-native';
import { AssetDetailSheet } from '@/components/AssetDetailSheet';
import { StillPointLogo } from '@/components/StillPointLogo';
import {
  Button,
  Card,
  EmptyState,
  LoadingState,
  SectionHeader,
  StatusBadge,
} from '@/components/ui';
import { fetchAssets, fetchIssues } from '@/lib/data-service';
import { formatDate } from '@/lib/utils';
import {
  ASSET_TYPE_CONFIG,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  RADII,
  SPACING,
} from '@/theme/tokens';
import { Asset, Issue } from '@/types';

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All Classes' },
  { key: 'road', label: '🛣️ Roads' },
  { key: 'bus_stop', label: '🚏 Bus Stops' },
  { key: 'footpath', label: '🚶 Footpaths' },
  { key: 'overbridge', label: '🌉 Bridges' },
];

const STATUS_FILTERS = [
  { key: 'all', label: 'All Statuses' },
  { key: 'open', label: 'Open Defects' },
  { key: 'fixed', label: 'Verified Fixed' },
  { key: 'clean', label: 'No Issues' },
];

export default function AssetRegistryScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [loadedAssets, loadedIssues] = await Promise.all([
        fetchAssets(),
        fetchIssues(),
      ]);
      setAssets(loadedAssets);
      setIssues(loadedIssues);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute open and fixed issue counts per asset
  const assetStatsMap = useMemo(() => {
    const map: Record<string, { openCount: number; fixedCount: number; latestIssue?: Issue }> = {};
    for (const issue of issues) {
      if (!issue.asset_id) continue;
      if (!map[issue.asset_id]) {
        map[issue.asset_id] = { openCount: 0, fixedCount: 0, latestIssue: issue };
      }
      if (issue.status === 'Verified Closed') {
        map[issue.asset_id].fixedCount += 1;
      } else {
        map[issue.asset_id].openCount += 1;
      }
    }
    return map;
  }, [issues]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (selectedType !== 'all' && asset.asset_type !== selectedType) return false;

      const stats = assetStatsMap[asset.id] || { openCount: 0, fixedCount: 0 };
      if (selectedStatusFilter === 'open' && stats.openCount === 0) return false;
      if (selectedStatusFilter === 'fixed' && stats.fixedCount === 0) return false;
      if (selectedStatusFilter === 'clean' && (stats.openCount > 0 || stats.fixedCount > 0)) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          asset.name.toLowerCase().includes(q) ||
          Boolean(asset.authority?.ward_name?.toLowerCase().includes(q)) ||
          asset.asset_type.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [assets, assetStatsMap, selectedType, selectedStatusFilter, searchQuery]);

  const openDetails = (asset: Asset) => {
    const linked = assetStatsMap[asset.id]?.latestIssue || null;
    setSelectedAsset(asset);
    setSelectedIssue(linked);
    setSheetVisible(true);
  };

  const renderAssetItem = ({ item: asset }: { item: Asset }) => {
    const stats = assetStatsMap[asset.id] || { openCount: 0, fixedCount: 0 };
    const linkedIssue = stats.latestIssue;
    const isExpanded = expandedAssetId === asset.id;
    const score = asset.condition_score ?? 100;
    const scoreColor =
      score > 70 ? COLORS.moss : score > 40 ? COLORS.clay : COLORS.danger;
    const typeInfo = ASSET_TYPE_CONFIG[asset.asset_type] || {
      label: asset.asset_type,
      icon: '🏛️',
    };

    return (
      <Card variant="white" style={styles.assetCard}>
        <Pressable onPress={() => openDetails(asset)} style={styles.assetHeader}>
          <View style={styles.emojiTile}>
            <Text style={styles.emojiText}>{typeInfo.icon}</Text>
          </View>

          <View style={styles.assetInfo}>
            <View style={styles.metaRow}>
              <Text style={styles.assetId}>#{asset.id.slice(0, 8).toUpperCase()}</Text>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>
                  {asset.asset_type.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              {linkedIssue ? <StatusBadge status={linkedIssue.status} /> : null}
            </View>

            <Text style={styles.assetName}>{asset.name}</Text>

            <View style={styles.locationRow}>
              <Building2 size={12} color={COLORS.sage} />
              <Text style={styles.locationText} numberOfLines={1}>
                {asset.authority?.ward_name || 'Municipal Ward'}
              </Text>
              {asset.lat !== undefined && asset.lng !== undefined ? (
                <>
                  <MapPin size={12} color={COLORS.sage} />
                  <Text style={styles.coordMono}>
                    {asset.lat.toFixed(3)}°N, {asset.lng.toFixed(3)}°E
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </Pressable>

        {/* Defect Counters + Condition Progress Bar */}
        <View style={styles.metricsSection}>
          <View style={styles.defectCountsRow}>
            <View style={styles.countChipOpen}>
              <Text style={styles.countChipOpenText}>
                Open Defects: {stats.openCount}
              </Text>
            </View>
            <View style={styles.countChipFixed}>
              <Text style={styles.countChipFixedText}>
                Fixed: {stats.fixedCount}
              </Text>
            </View>
          </View>

          <View style={styles.conditionRow}>
            <View style={styles.flex}>
              <View style={styles.conditionLabels}>
                <Text style={styles.conditionCaption}>Condition</Text>
                <Text style={styles.conditionValue}>{score} / 100</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, Math.max(0, score))}%`, backgroundColor: scoreColor },
                  ]}
                />
              </View>
            </View>

            <View style={styles.cardActions}>
              <Button
                title="Details"
                variant="outline"
                size="sm"
                onPress={() => openDetails(asset)}
              />
              {linkedIssue?.status_updates && linkedIssue.status_updates.length > 0 ? (
                <Pressable
                  onPress={() =>
                    setExpandedAssetId((prev) => (prev === asset.id ? null : asset.id))
                  }
                  style={styles.expandBtn}
                  accessibilityLabel="Toggle audit history"
                >
                  {isExpanded ? (
                    <ChevronDown size={18} color={COLORS.bark} />
                  ) : (
                    <ChevronRight size={18} color={COLORS.moss} />
                  )}
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        {/* Expandable Audit Trail */}
        {isExpanded && linkedIssue?.status_updates ? (
          <View style={styles.auditDrawer}>
            <View style={styles.auditDrawerHeader}>
              <History size={13} color={COLORS.clay} />
              <Text style={styles.auditDrawerTitle}>
                Audit Trail for #{linkedIssue.id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
            {linkedIssue.status_updates.map((u) => (
              <View key={u.id} style={styles.auditRow}>
                <View style={styles.flex}>
                  <Text style={styles.auditStatus}>{u.new_status}</Text>
                  {u.notes ? <Text style={styles.auditNote}>{u.notes}</Text> : null}
                  {u.audit_verdict ? (
                    <Text style={styles.auditVerdict}>
                      AI Audit: {u.audit_verdict} ({((u.audit_confidence || 0.95) * 100).toFixed(0)}%)
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.auditDate}>{formatDate(u.created_at)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AssetDetailSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        asset={selectedAsset}
        issue={selectedIssue}
        onReportNearby={() => router.push('/(tabs)/report')}
      />

      <FlatList
        data={loading ? [] : filteredAssets}
        keyExtractor={(item) => item.id}
        renderItem={renderAssetItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={COLORS.clay}
            colors={[COLORS.clay]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <SectionHeader
              eyebrow="Public Ledger"
              tag="Municipal Asset Index"
              title="Civic Asset Registry"
              subtitle="Public infrastructure directory, structural health ratings, and open/fixed defect ledgers."
            />

            {/* Search Input */}
            <View style={styles.searchWrap}>
              <Search size={15} color={COLORS.moss} />
              <TextInput
                style={styles.searchInput}
                placeholder="Filter by asset name, corridor, or ward..."
                placeholderTextColor={COLORS.sage}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsRow}
            >
              {CATEGORY_FILTERS.map((cat) => {
                const active = selectedType === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => setSelectedType(cat.key)}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Status Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsRow}
            >
              {STATUS_FILTERS.map((st) => {
                const active = selectedStatusFilter === st.key;
                return (
                  <Pressable
                    key={st.key}
                    onPress={() => setSelectedStatusFilter(st.key)}
                    style={[styles.statusPill, active && styles.statusPillActive]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        active && styles.statusPillTextActive,
                      ]}
                    >
                      {st.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState message="Reading Supabase Asset Registry..." />
          ) : (
            <EmptyState
              icon={
                <StillPointLogo
                  size={34}
                  variant="minimal"
                  color={COLORS.moss}
                  irisColor={COLORS.clay}
                />
              }
              title="No Infrastructure Assets Listed"
              description={
                searchQuery || selectedType !== 'all' || selectedStatusFilter !== 'all'
                  ? 'No assets match your active filters. Try clearing your query.'
                  : 'No registered municipal assets found yet. Citizen defect reports populate this ledger.'
              }
              action={
                <Button
                  title="Submit Field Report"
                  variant="primary"
                  size="sm"
                  leftIcon={<PlusCircle size={15} color={COLORS.clay} />}
                  onPress={() => router.push('/(tabs)/report')}
                />
              }
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.stone,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.base,
    gap: 12,
    paddingBottom: 28,
  },
  headerBlock: {
    gap: 10,
    marginBottom: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.linen,
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.bark,
    paddingVertical: 0,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADII.full,
    backgroundColor: COLORS.card,
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
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.full,
    backgroundColor: COLORS.linenLight,
    borderWidth: 1,
    borderColor: COLORS.linen,
  },
  statusPillActive: {
    backgroundColor: COLORS.clay,
    borderColor: COLORS.clay,
  },
  statusPillText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.moss,
  },
  statusPillTextActive: {
    color: COLORS.white,
  },
  assetCard: {
    padding: 0,
    overflow: 'hidden',
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  emojiTile: {
    width: 42,
    height: 42,
    borderRadius: RADII.md,
    backgroundColor: COLORS.stone,
    borderWidth: 1,
    borderColor: COLORS.linen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 19,
  },
  assetInfo: {
    flex: 1,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  assetId: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xxs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.sage,
  },
  classBadge: {
    backgroundColor: COLORS.linen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  classBadgeText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.moss,
  },
  assetName: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
    lineHeight: 21,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 2,
  },
  locationText: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
  },
  coordMono: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    color: COLORS.sage,
  },
  metricsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.linen,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: COLORS.card,
  },
  defectCountsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countChipOpen: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADII.full,
    backgroundColor: 'rgba(197, 138, 102, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(197, 138, 102, 0.35)',
  },
  countChipOpenText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.clayText,
  },
  countChipFixed: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADII.full,
    backgroundColor: 'rgba(94, 111, 99, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(94, 111, 99, 0.3)',
  },
  countChipFixedText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.moss,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  conditionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conditionCaption: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    color: COLORS.moss,
  },
  conditionValue: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.linen,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandBtn: {
    width: 32,
    height: 32,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.stone,
    borderWidth: 1,
    borderColor: COLORS.linen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditDrawer: {
    backgroundColor: COLORS.stone,
    borderTopWidth: 1,
    borderTopColor: COLORS.linen,
    padding: 14,
    gap: 8,
  },
  auditDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditDrawerTitle: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.linen,
    borderRadius: RADII.md,
    padding: 10,
  },
  auditStatus: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  auditNote: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
    marginTop: 2,
  },
  auditVerdict: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.moss,
    marginTop: 4,
  },
  auditDate: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    color: COLORS.sage,
  },
});
