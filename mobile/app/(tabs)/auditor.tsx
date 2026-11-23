// ============================================================
// STILL POINT Mobile — Tab 4: AI Resolution Auditor & SLA Engine
// Mirrors src/app/user/auditor/page.tsx:
//   - Lists issues eligible for after-repair verification + SLA countdowns
//   - Lets citizens capture an on-site "After" photo via expo-camera
//   - Submits before/after URL pair to POST /api/ai/audit
//   - Renders Resolved / Partially Patched / Unresolved verdict & reasoning
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import {
  AlertTriangle,
  Bot,
  Camera,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react-native';
import { CameraCaptureModal } from '@/components/CameraCaptureModal';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  SectionHeader,
  SeverityBadge,
  StatusBadge,
} from '@/components/ui';
import { requestAIAudit } from '@/lib/api-client';
import { isApiConfigured } from '@/lib/config';
import {
  addIssueMedia,
  fetchIssues,
  updateIssueStatus,
  uploadMediaFromUri,
} from '@/lib/data-service';
import { formatDate, getSLAStatus } from '@/lib/utils';
import {
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  RADII,
  SPACING,
} from '@/theme/tokens';
import { AIAuditResult, Issue } from '@/types';

export default function AuditorScreen() {
  const [activeTab, setActiveTab] = useState<'auditor' | 'followup'>('auditor');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [auditingIssueId, setAuditingIssueId] = useState<string | null>(null);
  const [auditResults, setAuditResults] = useState<Record<string, AIAuditResult>>({});

  // Citizen on-site "after" photo capture per issue
  const [captureTargetIssueId, setCaptureTargetIssueId] = useState<string | null>(null);
  const [capturedAfterUris, setCapturedAfterUris] = useState<Record<string, string>>({});

  const loadIssues = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await fetchIssues();
      setIssues(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Issues eligible for after-repair verification or already verified closed (matching web)
  const pendingAuditIssues = issues.filter(
    (i) => i.status === 'Repair Claimed' || i.status === 'Verified Closed'
  );

  // Active issues tracked by SLA Follow-Up Engine (matching web)
  const trackedIssues = issues.filter(
    (i) =>
      i.status === 'Reported' ||
      i.status === 'In Progress' ||
      i.status === 'Escalated'
  );

  const handleAfterPhotoCaptured = (result: { uri: string; width: number; height: number }) => {
    if (!captureTargetIssueId) return;
    setCapturedAfterUris((prev) => ({
      ...prev,
      [captureTargetIssueId]: result.uri,
    }));
    setCaptureTargetIssueId(null);
  };

  const triggerAudit = async (issue: Issue) => {
    setAuditingIssueId(issue.id);

    try {
      const beforeUrl =
        issue.media?.find((m) => m.stage === 'before')?.file_url || '';

      let afterUrl =
        issue.media?.find((m) => m.stage === 'after')?.file_url || '';

      // If citizen captured a fresh on-site after photo, upload it to Supabase Storage first
      const localAfterUri = capturedAfterUris[issue.id];
      if (localAfterUri) {
        const uploadRes = await uploadMediaFromUri(localAfterUri, 'audits');
        if (uploadRes.success && uploadRes.publicUrl) {
          afterUrl = uploadRes.publicUrl;

          let coords: { lat: number; lng: number } | null = null;
          try {
            const perm = await Location.getForegroundPermissionsAsync();
            if (perm.granted) {
              const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            }
          } catch {
            // Optional GPS tag for after-photo
          }
          await addIssueMedia(issue.id, afterUrl, 'after', coords);
        }
      }

      if (!isApiConfigured()) {
        Alert.alert(
          'Backend URL Required',
          'Set EXPO_PUBLIC_API_BASE_URL in mobile/.env to submit paired photos to /api/ai/audit.'
        );
        return;
      }

      const result = await requestAIAudit({
        before_url: beforeUrl,
        after_url: afterUrl,
        issue_id: issue.id,
      });

      setAuditResults((prev) => ({
        ...prev,
        [issue.id]: result,
      }));

      // Match web logic verbatim: if Resolved with >= 85% confidence and no human review flag, close ticket
      if (result.verdict === 'Resolved' && !result.requires_human_review) {
        await updateIssueStatus(
          issue.id,
          'Verified Closed',
          result.reasoning ||
            'Automated paired visual inspection verified structural remediation.',
          result.verdict,
          result.confidence
        );

        setIssues((prev) =>
          prev.map((item) =>
            item.id === issue.id ? { ...item, status: 'Verified Closed' } : item
          )
        );
      }
    } catch (err) {
      Alert.alert(
        'AI Audit Error',
        err instanceof Error ? err.message : 'Unable to complete paired photo audit.'
      );
    } finally {
      setAuditingIssueId(null);
    }
  };

  return (
    <View style={styles.container}>
      <CameraCaptureModal
        visible={Boolean(captureTargetIssueId)}
        title="Capture On-Site After-Repair Photo"
        onClose={() => setCaptureTargetIssueId(null)}
        onCaptured={handleAfterPhotoCaptured}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadIssues(true)}
            tintColor={COLORS.clay}
            colors={[COLORS.clay]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          eyebrow="Quality Assurance"
          tag="Automated Inspection"
          title="AI Auditor & SLA Engine"
          subtitle="Objective before-and-after repair verification and statutory SLA countdown tracking."
        />

        {/* Segmented Tab Switcher */}
        <View style={styles.segmentWrap}>
          <Pressable
            onPress={() => setActiveTab('auditor')}
            style={[
              styles.segmentBtn,
              activeTab === 'auditor' && styles.segmentBtnActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'auditor' && styles.segmentTextActive,
              ]}
            >
              Resolution Auditor ({pendingAuditIssues.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('followup')}
            style={[
              styles.segmentBtn,
              activeTab === 'followup' && styles.segmentBtnActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'followup' && styles.segmentTextActive,
              ]}
            >
              SLA Tracker ({trackedIssues.length})
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <LoadingState message="Loading Verification Queues..." />
        ) : activeTab === 'auditor' ? (
          <View style={styles.sectionStack}>
            {/* Rubric Info Banner */}
            <Card style={styles.rubricCard}>
              <View style={styles.rubricIcon}>
                <Sparkles size={16} color={COLORS.moss} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.rubricTitle}>Multimodal Visual Remediation Rubric</Text>
                <Text style={styles.rubricDesc}>
                  Capture a fresh on-site &ldquo;After&rdquo; photo or audit crew evidence against the original &ldquo;Before&rdquo; defect. Verdicts with ≥ 85% confidence and complete remediation transition to Verified Closed.
                </Text>
              </View>
            </Card>

            {pendingAuditIssues.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={28} color={COLORS.moss} />}
                title="No Audits Awaiting Verification"
                description='No tickets currently reside in "Repair Claimed" state. Once municipal crews mark a repair completed, they appear here for verification.'
              />
            ) : (
              pendingAuditIssues.map((issue) => {
                const audit = auditResults[issue.id];
                const isRunning = auditingIssueId === issue.id;
                const beforePhoto = issue.media?.find((m) => m.stage === 'before')?.file_url;
                const existingAfter = issue.media?.find((m) => m.stage === 'after')?.file_url;
                const localAfter = capturedAfterUris[issue.id];
                const displayAfter = localAfter || existingAfter;
                const slaInfo = getSLAStatus(issue.sla_due_at);

                return (
                  <Card key={issue.id} variant="white" style={styles.issueCard}>
                    <View style={styles.issueTop}>
                      <View style={styles.badgeRow}>
                        <Text style={styles.issueId}>#{issue.id.slice(0, 8).toUpperCase()}</Text>
                        <SeverityBadge severity={issue.severity} />
                        <StatusBadge status={issue.status} />
                      </View>
                      <Text style={styles.issueTitle}>
                        {issue.category} — {issue.asset?.name || 'Corridor Asset'}
                      </Text>
                      <View style={styles.metaLine}>
                        <Text style={styles.metaText}>
                          Intake: {formatDate(issue.created_at)}
                        </Text>
                        <Text style={styles.metaSep}>•</Text>
                        <Text
                          style={[
                            styles.metaText,
                            slaInfo.isBreached ? { color: COLORS.danger } : undefined,
                          ]}
                        >
                          SLA: {slaInfo.label}
                        </Text>
                      </View>
                    </View>

                    {/* Paired Before / After Photos */}
                    <View style={styles.photoPair}>
                      <View style={styles.photoCol}>
                        <Text style={styles.photoLabel}>1. BEFORE (DEFECT)</Text>
                        <View style={styles.photoFrame}>
                          {beforePhoto ? (
                            <Image
                              source={{ uri: beforePhoto }}
                              style={styles.photoImg}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={styles.noPhotoText}>No before image</Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.photoCol}>
                        <Text style={[styles.photoLabel, { color: COLORS.moss }]}>
                          2. AFTER {localAfter ? '(CITIZEN SITE CAPTURE)' : '(REPAIR)'}
                        </Text>
                        <View style={[styles.photoFrame, styles.photoFrameAfter]}>
                          {displayAfter ? (
                            <Image
                              source={{ uri: displayAfter }}
                              style={styles.photoImg}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={styles.noPhotoText}>Capture after photo</Text>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* AI Audit Verdict Box */}
                    {audit ? (
                      <View
                        style={[
                          styles.verdictBox,
                          audit.verdict === 'Resolved'
                            ? styles.verdictResolved
                            : audit.verdict === 'Partially Patched'
                              ? styles.verdictPartial
                              : styles.verdictUnresolved,
                        ]}
                      >
                        <View style={styles.verdictHeader}>
                          <View style={styles.verdictTitleRow}>
                            {audit.verdict === 'Resolved' ? (
                              <CheckCircle2 size={16} color={COLORS.moss} />
                            ) : audit.verdict === 'Partially Patched' ? (
                              <AlertTriangle size={16} color={COLORS.clay} />
                            ) : (
                              <XCircle size={16} color={COLORS.danger} />
                            )}
                            <Text style={styles.verdictTitle}>
                              AI Verdict: {audit.verdict}
                            </Text>
                          </View>
                          <Text style={styles.verdictConfidence}>
                            {((audit.confidence || 0.9) * 100).toFixed(0)}% Conf.
                          </Text>
                        </View>

                        <Text style={styles.verdictReasoning}>{audit.reasoning}</Text>

                        {audit.requires_human_review ? (
                          <View style={styles.reviewFlag}>
                            <AlertTriangle size={13} color={COLORS.clayText} />
                            <Text style={styles.reviewFlagText}>
                              Flagged for Senior Engineer review (&lt;85% confidence or partial patch).
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    {/* Actions */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.authorityCaption}>
                        Authority:{' '}
                        <Text style={styles.boldText}>
                          {issue.authority?.ward_name || 'Central Ward'}
                        </Text>
                      </Text>

                      {issue.status === 'Repair Claimed' ? (
                        <View style={styles.auditBtnRow}>
                          <Button
                            title={localAfter ? 'Retake After Photo' : 'Capture After Photo'}
                            variant="outline"
                            size="sm"
                            leftIcon={<Camera size={14} color={COLORS.bark} />}
                            onPress={() => setCaptureTargetIssueId(issue.id)}
                            style={styles.flex}
                          />
                          <Button
                            title="Run AI Audit"
                            variant="primary"
                            size="sm"
                            loading={isRunning}
                            leftIcon={<Bot size={14} color={COLORS.clay} />}
                            onPress={() => triggerAudit(issue)}
                            style={styles.flex}
                          />
                        </View>
                      ) : (
                        <Badge
                          label="Verified Closed & Sealed"
                          variant="moss"
                          icon={<CheckCircle2 size={12} color={COLORS.stone} />}
                        />
                      )}
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        ) : (
          /* TAB 2: SLA FOLLOW-UP TRACKER */
          <View style={styles.sectionStack}>
            <Card style={styles.rubricCard}>
              <View style={[styles.rubricIcon, { backgroundColor: 'rgba(197, 138, 102, 0.16)' }]}>
                <Clock size={16} color={COLORS.clay} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.rubricTitle}>Municipal Resolution SLA Tracker</Text>
                <Text style={styles.rubricDesc}>
                  Statutory deadlines: 14 days for Critical/High (S3/S4) and 30 days for Medium/Low (S1/S2). Overdue tickets auto-escalate.
                </Text>
              </View>
            </Card>

            {trackedIssues.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck size={28} color={COLORS.moss} />}
                title="No Active SLA Grievances"
                description="All reported tickets have been remediated or verified closed."
              />
            ) : (
              trackedIssues.map((issue) => {
                const slaInfo = getSLAStatus(issue.sla_due_at);
                return (
                  <Card key={issue.id} variant="white" style={styles.slaItemCard}>
                    <View style={styles.badgeRow}>
                      <Text style={styles.issueId}>#{issue.id.slice(0, 8).toUpperCase()}</Text>
                      <SeverityBadge severity={issue.severity} />
                      <StatusBadge status={issue.status} />
                      {issue.escalation_count > 0 ? (
                        <Badge label={`Escalated ×${issue.escalation_count}`} variant="red" />
                      ) : null}
                    </View>

                    <Text style={styles.issueTitle}>
                      {issue.category} — {issue.asset?.name || 'Corridor Asset'}
                    </Text>

                    <Text style={styles.metaText}>
                      Assigned:{' '}
                      <Text style={styles.boldText}>
                        {issue.authority?.contact_name || 'Ward Engineer'}
                      </Text>{' '}
                      ({issue.authority?.ward_name || 'Jurisdiction'})
                    </Text>

                    <View
                      style={[
                        styles.slaFooterRow,
                        slaInfo.isBreached ? styles.slaFooterBreached : undefined,
                      ]}
                    >
                      <Text style={styles.slaFooterLabel}>SLA EXPIRY TARGET</Text>
                      <Text
                        style={[
                          styles.slaFooterValue,
                          slaInfo.isBreached ? { color: COLORS.danger } : undefined,
                        ]}
                      >
                        {formatDate(issue.sla_due_at || '')} ({slaInfo.label})
                      </Text>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
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
  content: {
    padding: SPACING.base,
    gap: 14,
    paddingBottom: 32,
  },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: COLORS.linen,
    borderRadius: RADII.lg,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADII.md,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: COLORS.bark,
  },
  segmentText: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.moss,
  },
  segmentTextActive: {
    color: COLORS.stone,
  },
  sectionStack: {
    gap: 12,
  },
  rubricCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rubricIcon: {
    width: 34,
    height: 34,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(94, 111, 99, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rubricTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  rubricDesc: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
    lineHeight: 17,
    marginTop: 3,
  },
  issueCard: {
    gap: 14,
  },
  issueTop: {
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.linen,
    paddingBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  issueId: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xxs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.sage,
  },
  issueTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
  },
  metaSep: {
    color: COLORS.sage,
  },
  boldText: {
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  photoPair: {
    flexDirection: 'row',
    gap: 10,
  },
  photoCol: {
    flex: 1,
    gap: 5,
  },
  photoLabel: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
    letterSpacing: 0.6,
  },
  photoFrame: {
    aspectRatio: 4 / 3,
    borderRadius: RADII.md,
    overflow: 'hidden',
    backgroundColor: COLORS.stone,
    borderWidth: 1,
    borderColor: COLORS.linen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFrameAfter: {
    borderColor: 'rgba(94, 111, 99, 0.4)',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  noPhotoText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    color: COLORS.sage,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  verdictBox: {
    borderRadius: RADII.md,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  verdictResolved: {
    backgroundColor: 'rgba(94, 111, 99, 0.12)',
    borderColor: 'rgba(94, 111, 99, 0.35)',
  },
  verdictPartial: {
    backgroundColor: 'rgba(197, 138, 102, 0.15)',
    borderColor: 'rgba(197, 138, 102, 0.4)',
  },
  verdictUnresolved: {
    backgroundColor: 'rgba(168, 72, 53, 0.14)',
    borderColor: 'rgba(168, 72, 53, 0.4)',
  },
  verdictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verdictTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verdictTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  verdictConfidence: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.moss,
  },
  verdictReasoning: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.bark,
    lineHeight: 18,
  },
  reviewFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.linen,
    paddingTop: 6,
    marginTop: 2,
  },
  reviewFlagText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 10,
    color: COLORS.clayText,
  },
  cardFooter: {
    gap: 10,
  },
  authorityCaption: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
  },
  auditBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slaItemCard: {
    gap: 8,
  },
  slaFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.stone,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.linen,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 2,
  },
  slaFooterBreached: {
    backgroundColor: 'rgba(168, 72, 53, 0.08)',
    borderColor: 'rgba(168, 72, 53, 0.28)',
  },
  slaFooterLabel: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.sage,
  },
  slaFooterValue: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
});
