// ============================================================
// STILL POINT Mobile Asset & Issue Detail Bottom Sheet
// Mirrors src/components/map/AssetDetailSlideOver.tsx
// ============================================================

import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  History,
  MapPin,
  X,
} from 'lucide-react-native';
import { Button, SeverityBadge, StatusBadge } from '@/components/ui';
import { formatDate, formatDateTime, getSLAStatus } from '@/lib/utils';
import {
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  RADII,
  SPACING,
} from '@/theme/tokens';
import { Asset, Issue } from '@/types';

interface AssetDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  issue: Issue | null;
  asset: Asset | null;
  onReportNearby?: () => void;
}

export function AssetDetailSheet({
  visible,
  onClose,
  issue,
  asset,
  onReportNearby,
}: AssetDetailSheetProps) {
  if (!issue && !asset) return null;

  const currentAsset = issue?.asset || asset;
  const slaInfo = issue ? getSLAStatus(issue.sla_due_at) : null;
  const lat = issue?.lat ?? currentAsset?.lat;
  const lng = issue?.lng ?? currentAsset?.lng;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Drag Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerMeta}>
              <Text style={styles.idText}>
                {issue
                  ? `TICKET #${issue.id.slice(0, 8).toUpperCase()}`
                  : `ASSET #${currentAsset?.id.slice(0, 8).toUpperCase()}`}
              </Text>
              {issue ? <StatusBadge status={issue.status} /> : null}
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close details"
            >
              <X size={20} color={COLORS.moss} />
            </Pressable>
          </View>

          {/* Scrollable Body */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Field Evidence Photography */}
            {issue?.media && issue.media.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>FIELD EVIDENCE PHOTOGRAPHY</Text>
                <View style={styles.photoGrid}>
                  {issue.media.map((m) => (
                    <View key={m.id} style={styles.photoBox}>
                      <Image
                        source={{ uri: m.file_url }}
                        style={styles.photoImg}
                        resizeMode="cover"
                      />
                      <View style={styles.stageTag}>
                        <Text style={styles.stageTagText}>{m.stage.toUpperCase()}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Title, Severity, Coordinates */}
            <View style={styles.section}>
              <View style={styles.badgeRow}>
                {issue ? <SeverityBadge severity={issue.severity} /> : null}
                <Text style={styles.categoryTag}>
                  {issue
                    ? issue.category
                    : (currentAsset?.asset_type || '').replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.mainTitle}>
                {currentAsset?.name || issue?.category || 'Municipal Infrastructure Asset'}
              </Text>
              {lat !== undefined && lng !== undefined ? (
                <View style={styles.coordRow}>
                  <MapPin size={14} color={COLORS.clay} />
                  <Text style={styles.coordText}>
                    {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Condition Score for Asset */}
            {currentAsset ? (
              <View style={styles.infoBox}>
                <View style={styles.infoRowBetween}>
                  <Text style={styles.infoTitle}>Asset Structural Condition</Text>
                  <Text style={styles.monoStrong}>{currentAsset.condition_score} / 100</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, Math.max(0, currentAsset.condition_score))}%`,
                        backgroundColor:
                          currentAsset.condition_score > 70
                            ? COLORS.moss
                            : currentAsset.condition_score > 40
                              ? COLORS.clay
                              : COLORS.danger,
                      },
                    ]}
                  />
                </View>
              </View>
            ) : null}

            {/* Engineering Assessment */}
            {issue ? (
              <View style={styles.infoBox}>
                <View style={styles.infoRowBetween}>
                  <View style={styles.iconTitleRow}>
                    <FileText size={14} color={COLORS.moss} />
                    <Text style={styles.infoTitle}>Engineering Assessment</Text>
                  </View>
                  <Text style={styles.confidenceText}>
                    Confidence:{' '}
                    {(
                      (issue.human_final_json?.confidence ||
                        issue.ai_raw_json?.confidence ||
                        0.9) * 100
                    ).toFixed(0)}
                    %
                  </Text>
                </View>
                <Text style={styles.bodyText}>
                  {issue.human_final_json?.technical_summary ||
                    issue.ai_raw_json?.technical_summary ||
                    'Assessment pending on-site evaluation.'}
                </Text>
                {issue.human_final_json?.user_note ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteText}>
                      <Text style={styles.noteBold}>Citizen Note: </Text>
                      {issue.human_final_json.user_note}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* SLA Status */}
            {issue && slaInfo ? (
              <View
                style={[
                  styles.slaCard,
                  slaInfo.isBreached ? styles.slaCardBreached : styles.slaCardNormal,
                ]}
              >
                <View style={styles.iconTitleRow}>
                  <Clock
                    size={18}
                    color={slaInfo.isBreached ? COLORS.danger : COLORS.moss}
                  />
                  <View>
                    <Text
                      style={[
                        styles.slaTitle,
                        slaInfo.isBreached ? { color: COLORS.dangerText } : undefined,
                      ]}
                    >
                      Municipal SLA Deadline
                    </Text>
                    <Text style={styles.slaDate}>
                      {formatDate(issue.sla_due_at || '')}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.slaPill,
                    slaInfo.isBreached ? styles.slaPillBreached : styles.slaPillNormal,
                  ]}
                >
                  <Text
                    style={[
                      styles.slaPillText,
                      slaInfo.isBreached ? { color: COLORS.dangerText } : undefined,
                    ]}
                  >
                    {slaInfo.label}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Mapped Municipal Authority */}
            {(issue?.authority || currentAsset?.authority) ? (
              <View style={styles.infoBox}>
                <View style={styles.iconTitleRow}>
                  <Building2 size={14} color={COLORS.moss} />
                  <Text style={styles.infoTitle}>Mapped Municipal Ward</Text>
                </View>
                <Text style={styles.wardName}>
                  {(issue?.authority || currentAsset?.authority)?.ward_name}
                </Text>
                <Text style={styles.wardSub}>
                  {(issue?.authority || currentAsset?.authority)?.department_name}
                </Text>
                <Text style={styles.wardSub}>
                  Official: {(issue?.authority || currentAsset?.authority)?.contact_name}
                </Text>
                <Text style={styles.wardEmail}>
                  {(issue?.authority || currentAsset?.authority)?.email}
                </Text>
              </View>
            ) : null}

            {/* Chronological Audit Trail */}
            {issue ? (
              <View style={styles.section}>
                <View style={styles.iconTitleRow}>
                  <History size={14} color={COLORS.sage} />
                  <Text style={styles.sectionLabel}>CHRONOLOGICAL AUDIT TRAIL</Text>
                </View>

                <View style={styles.timeline}>
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: COLORS.bark }]} />
                    <View style={styles.timelineBody}>
                      <Text style={styles.timelineTitle}>Defect Reported by Citizen</Text>
                      <Text style={styles.timelineDate}>
                        {formatDateTime(issue.created_at)}
                      </Text>
                    </View>
                  </View>

                  {issue.status_updates?.map((u) => (
                    <View key={u.id} style={styles.timelineItem}>
                      <View
                        style={[
                          styles.timelineDot,
                          {
                            backgroundColor:
                              u.new_status === 'Verified Closed'
                                ? COLORS.moss
                                : u.new_status === 'Escalated'
                                  ? COLORS.danger
                                  : COLORS.clay,
                          },
                        ]}
                      />
                      <View style={styles.timelineBody}>
                        <Text style={styles.timelineTitle}>Status: {u.new_status}</Text>
                        {u.notes ? <Text style={styles.timelineNotes}>{u.notes}</Text> : null}
                        {u.audit_verdict ? (
                          <View style={styles.auditPill}>
                            <CheckCircle2 size={12} color={COLORS.moss} />
                            <Text style={styles.auditPillText}>
                              AI Audit: {u.audit_verdict} (
                              {((u.audit_confidence || 0.95) * 100).toFixed(0)}%)
                            </Text>
                          </View>
                        ) : null}
                        <Text style={styles.timelineDate}>
                          {formatDateTime(u.created_at)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {onReportNearby ? (
              <Button
                title="Report Nearby Defect"
                variant="outline"
                size="sm"
                onPress={() => {
                  onClose();
                  onReportNearby();
                }}
                style={styles.footerBtn}
              />
            ) : null}
            <Button
              title="Close Panel"
              variant="primary"
              size="sm"
              onPress={onClose}
              style={styles.footerBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(38, 48, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    maxHeight: '84%',
    backgroundColor: COLORS.stone,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: COLORS.linen,
    overflow: 'hidden',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: COLORS.card,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.linen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.linen,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  idText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xxs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.sage,
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADII.md,
    backgroundColor: COLORS.stone,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: SPACING.base,
    gap: SPACING.base,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xxs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.moss,
    letterSpacing: 1.2,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoBox: {
    width: '48%',
    aspectRatio: 16 / 10,
    borderRadius: RADII.md,
    overflow: 'hidden',
    backgroundColor: COLORS.linen,
    borderWidth: 1,
    borderColor: COLORS.linen,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  stageTag: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(38, 48, 42, 0.85)',
  },
  stageTagText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.stone,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
    lineHeight: 25,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coordText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.moss,
  },
  infoBox: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.linen,
    padding: 14,
    gap: 6,
  },
  infoRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.bark,
  },
  confidenceText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xxs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.sage,
  },
  monoStrong: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.linen,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  bodyText: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.bark,
    lineHeight: 19,
  },
  noteBox: {
    borderTopWidth: 1,
    borderTopColor: COLORS.linen,
    paddingTop: 8,
    marginTop: 4,
  },
  noteText: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.moss,
  },
  noteBold: {
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.bark,
  },
  slaCard: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  slaCardNormal: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.linen,
  },
  slaCardBreached: {
    backgroundColor: 'rgba(168, 72, 53, 0.1)',
    borderColor: 'rgba(168, 72, 53, 0.3)',
  },
  slaTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  slaDate: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
  },
  slaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.sm,
  },
  slaPillNormal: {
    backgroundColor: COLORS.linen,
  },
  slaPillBreached: {
    backgroundColor: 'rgba(168, 72, 53, 0.2)',
  },
  slaPillText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xxs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.moss,
  },
  wardName: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
    marginTop: 2,
  },
  wardSub: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.moss,
  },
  wardEmail: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.clay,
    marginTop: 2,
  },
  timeline: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.linen,
    marginLeft: 6,
    paddingLeft: 14,
    gap: 14,
  },
  timelineItem: {
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: -20,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.stone,
  },
  timelineBody: {
    gap: 2,
  },
  timelineTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  timelineNotes: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.moss,
  },
  timelineDate: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xxs,
    color: COLORS.sage,
    marginTop: 2,
  },
  auditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(94, 111, 99, 0.15)',
    marginTop: 3,
  },
  auditPillText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xxs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.moss,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: SPACING.base,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.linen,
  },
  footerBtn: {
    flex: 1,
  },
});
