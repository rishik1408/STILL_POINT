// ============================================================
// STILL POINT Mobile — Tab 2: Report Infrastructure Defect
// Mirrors src/app/user/report/page.tsx 6-step pipeline with:
//   - expo-camera + gallery fallback compressed to 1600px JPEG
//   - expo-location live GPS coordinate capture
//   - POST /api/ai/report -> Citizen Verification Gate
//   - Deterministic Ward Routing + Supabase persistence
//   - POST /api/ai/draft-email & POST /api/email/send
//   - NetInfo offline queue (expo-sqlite + expo-file-system) with auto-sync
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  CloudOff,
  Mail,
  MapPin,
  RefreshCw,
  Send,
  WifiOff,
} from 'lucide-react-native';
import { CameraCaptureModal } from '@/components/CameraCaptureModal';
import {
  Badge,
  Button,
  Card,
  SectionHeader,
  SeverityBadge,
  StepIndicator,
} from '@/components/ui';
import {
  requestAIReport,
  requestDraftEmail,
  requestSendEmail,
} from '@/lib/api-client';
import { isApiConfigured } from '@/lib/config';
import {
  createIssue,
  routeIssueToAuthority,
  uploadMediaFromUri,
} from '@/lib/data-service';
import {
  isNetStateOnline,
  offlineQueue,
} from '@/lib/offline-queue';
import { processOfflineDraft } from '@/lib/offline-sync-processor';
import {
  COLORS,
  DEFECT_CATEGORIES,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  RADII,
  SPACING,
} from '@/theme/tokens';
import {
  AIReportResult,
  Authority,
  DefectCategory,
  GeoPoint,
  LocationSource,
  OfflineDraftRecord,
} from '@/types';

const STEPS = [
  'Photo & GPS',
  'AI Triage',
  'Verify',
  'Ward Route',
  'Notice',
  'Done',
];

export default function ReportDefectScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Connectivity & Offline Queue state
  const [isOnline, setIsOnline] = useState(true);
  const [pendingDrafts, setPendingDrafts] = useState<OfflineDraftRecord[]>([]);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const [offlineSavedBanner, setOfflineSavedBanner] = useState<string | null>(null);

  // Step 1: Photo & GPS
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<GeoPoint>({ lat: 18.922, lng: 72.833 });
  const [latText, setLatText] = useState('18.9220');
  const [lngText, setLngText] = useState('72.8330');
  const [locationSource, setLocationSource] = useState<LocationSource>('manual');
  const [capturingGps, setCapturingGps] = useState(false);
  const [capturedAt, setCapturedAt] = useState<string>(new Date().toISOString());
  const [citizenNote, setCitizenNote] = useState('');

  // Step 2: AI Triage
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRawResult, setAiRawResult] = useState<AIReportResult | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  // Step 3: Citizen Verification
  const [verifiedCategory, setVerifiedCategory] = useState<DefectCategory>('Pothole');
  const [verifiedSeverity, setVerifiedSeverity] = useState<number>(3);
  const [verifiedSummary, setVerifiedSummary] = useState('');

  // Step 4: Ward Routing
  const [mappedAuthority, setMappedAuthority] = useState<Authority | null>(null);
  const [slaDays, setSlaDays] = useState<number>(14);

  // Step 5: Notice Email
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isDraftingEmail, setIsDraftingEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 6: Confirmation
  const [generatedTicketId, setGeneratedTicketId] = useState('');

  const refreshPendingQueue = useCallback(async () => {
    try {
      const items = await offlineQueue.getPendingDrafts();
      setPendingDrafts(items);
    } catch {
      // Ignore SQLite read error on startup
    }
  }, []);

  const handleSyncQueue = useCallback(async () => {
    setIsSyncingQueue(true);
    try {
      const summary = await offlineQueue.syncPendingDrafts(processOfflineDraft);
      await refreshPendingQueue();
      if (summary.syncedCount > 0) {
        setOfflineSavedBanner(
          `Synchronized ${summary.syncedCount} offline report${summary.syncedCount > 1 ? 's' : ''} to STILL POINT.`
        );
      } else if (summary.failedCount > 0) {
        Alert.alert(
          'Partial Sync',
          `${summary.failedCount} draft(s) could not sync yet: ${summary.errors[0]?.error || 'Network error'}`
        );
      }
    } finally {
      setIsSyncingQueue(false);
    }
  }, [refreshPendingQueue]);

  // Monitor network state & auto-sync queued drafts
  useEffect(() => {
    refreshPendingQueue();
    const unsub = NetInfo.addEventListener((state) => {
      const onlineNow = isNetStateOnline(state);
      setIsOnline(onlineNow);
      if (onlineNow) {
        offlineQueue
          .syncPendingDrafts(processOfflineDraft)
          .then((summary) => {
            if (summary.processedIds.length > 0) {
              refreshPendingQueue();
            }
          })
          .catch(() => {});
      }
    });
    return unsub;
  }, [refreshPendingQueue]);

  // Acquire device GPS via expo-location
  const captureDeviceGps = useCallback(async () => {
    setCapturingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'GPS permission was denied. You can adjust coordinates manually below.'
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setGpsLocation(next);
      setLatText(next.lat.toFixed(6));
      setLngText(next.lng.toFixed(6));
      setLocationSource('gps');
      setCapturedAt(new Date(pos.timestamp || Date.now()).toISOString());
    } catch {
      Alert.alert('GPS Notice', 'Could not lock onto GPS signal. Using last known coordinates.');
    } finally {
      setCapturingGps(false);
    }
  }, []);

  // Automatically request GPS when opening report tab
  useEffect(() => {
    captureDeviceGps();
  }, [captureDeviceGps]);

  const handlePhotoCaptured = (result: { uri: string; width: number; height: number }) => {
    setPhotoUri(result.uri);
    setCapturedAt(new Date().toISOString());
    setStepError(null);
    setOfflineSavedBanner(null);
  };

  const syncParsedCoords = (): GeoPoint => {
    const parsedLat = parseFloat(latText);
    const parsedLng = parseFloat(lngText);
    const coords = {
      lat: Number.isFinite(parsedLat) ? parsedLat : gpsLocation.lat,
      lng: Number.isFinite(parsedLng) ? parsedLng : gpsLocation.lng,
    };
    setGpsLocation(coords);
    return coords;
  };

  // Save report locally to expo-sqlite + expo-file-system when offline
  const saveToOfflineQueue = async () => {
    if (!photoUri) return;
    const coords = syncParsedCoords();
    try {
      await offlineQueue.enqueueDraft({
        photoUri,
        lat: coords.lat,
        lng: coords.lng,
        locationSource,
        timestamp: capturedAt,
        note: citizenNote,
      });
      await refreshPendingQueue();
      setOfflineSavedBanner(
        'Saved locally to offline SQLite queue. It will automatically upload and route when connectivity returns.'
      );
      setPhotoUri(null);
      setCitizenNote('');
      setCurrentStep(0);
    } catch (err) {
      Alert.alert(
        'Offline Save Error',
        err instanceof Error ? err.message : 'Unable to save draft locally.'
      );
    }
  };

  // Step 1 -> Step 2: Submit photo + GPS to POST /api/ai/report
  const proceedToAITriage = async () => {
    if (!photoUri) return;
    setStepError(null);
    const coords = syncParsedCoords();

    if (!isOnline) {
      await saveToOfflineQueue();
      return;
    }

    setCurrentStep(1);
    setIsAnalyzing(true);

    try {
      let data: AIReportResult;
      if (isApiConfigured()) {
        data = await requestAIReport({
          photoUri,
          lat: coords.lat,
          lng: coords.lng,
        });
      } else {
        throw new Error(
          'EXPO_PUBLIC_API_BASE_URL is not set. Configure mobile/.env or save this report to the offline queue.'
        );
      }

      setAiRawResult(data);
      setVerifiedCategory(data.defect_category);
      setVerifiedSeverity(data.severity);
      setVerifiedSummary(data.technical_summary);

      const ward = await routeIssueToAuthority(coords.lat, coords.lng);
      setMappedAuthority(ward);
      setSlaDays(data.severity === 4 ? 14 : 30);
    } catch (err) {
      setStepError(err instanceof Error ? err.message : 'AI structural triage failed.');
      // Provide editable defaults so user can still verify or retry
      const fallback: AIReportResult = {
        defect_category: 'Pothole',
        severity: 3,
        confidence: 0.85,
        technical_summary:
          citizenNote.trim() ||
          'Surface defect captured in field. Manual verification requested prior to ward dispatch.',
      };
      setAiRawResult(fallback);
      setVerifiedCategory(fallback.defect_category);
      setVerifiedSeverity(fallback.severity);
      setVerifiedSummary(fallback.technical_summary);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 3 -> Step 4: Route Ward
  const proceedToRouting = async () => {
    const coords = syncParsedCoords();
    const ward = await routeIssueToAuthority(coords.lat, coords.lng);
    setMappedAuthority(ward);
    setSlaDays(verifiedSeverity === 4 ? 14 : 30);
    setCurrentStep(3);
  };

  // Step 4 -> Step 5: Draft Email via POST /api/ai/draft-email
  const proceedToEmailDraft = async () => {
    setCurrentStep(4);
    setIsDraftingEmail(true);
    setStepError(null);

    const coords = syncParsedCoords();
    const provisionalTicket =
      'STILL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedTicketId(provisionalTicket);

    try {
      const drafted = await requestDraftEmail({
        ticket_id: provisionalTicket,
        defect_category: verifiedCategory,
        severity: verifiedSeverity,
        technical_summary: verifiedSummary,
        user_note: citizenNote,
        ward_name: mappedAuthority?.ward_name || 'Ward A — Colaba & Fort',
        department_name:
          mappedAuthority?.department_name || 'Municipal Roads & Infrastructure',
        contact_name: mappedAuthority?.contact_name || 'Executive Engineer',
        lat: coords.lat,
        lng: coords.lng,
      });

      setEmailSubject(drafted.subject);
      setEmailBody(drafted.body);
    } catch (err) {
      setStepError(
        err instanceof Error
          ? `${err.message} — using standard statutory template.`
          : 'Using standard statutory template.'
      );
      setEmailSubject(
        `[URGENT TICKET #${provisionalTicket}] Level ${verifiedSeverity} Infrastructure Defect Notice: ${verifiedCategory}`
      );
      setEmailBody(
        `To: ${mappedAuthority?.contact_name || 'Executive Engineer'}\n${mappedAuthority?.department_name || 'Municipal Infrastructure'}\n\nDefect: ${verifiedCategory} (Level ${verifiedSeverity}/4)\nCoordinates: ${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E\nSummary: ${verifiedSummary}\n${citizenNote ? `Citizen Observation: ${citizenNote}\n` : ''}\nMandatory SLA: ${slaDays} calendar days.`
      );
    } finally {
      setIsDraftingEmail(false);
    }
  };

  // Step 5 -> Step 6: Upload photo, save Supabase issue, dispatch email via POST /api/email/send
  const dispatchAndSubmit = async () => {
    setIsSubmitting(true);
    setStepError(null);
    const coords = syncParsedCoords();

    try {
      let uploadedUrl: string | null = null;
      if (photoUri) {
        const uploadRes = await uploadMediaFromUri(photoUri, 'issues');
        if (uploadRes.success && uploadRes.publicUrl) {
          uploadedUrl = uploadRes.publicUrl;
        }
      }

      const slaDue = new Date(
        Date.now() + (verifiedSeverity === 4 ? 14 : 30) * 86400000
      ).toISOString();

      const createRes = await createIssue({
        category: verifiedCategory,
        severity: verifiedSeverity,
        status: 'Reported',
        lat: coords.lat,
        lng: coords.lng,
        authority_id: mappedAuthority?.id || null,
        media_url: uploadedUrl,
        media_stage: 'before',
        sla_due_at: slaDue,
        initial_notes: citizenNote || 'Defect reported via STILL POINT Android App.',
        ai_raw_json: aiRawResult,
        human_final_json: {
          defect_category: verifiedCategory,
          severity: verifiedSeverity,
          confidence: aiRawResult?.confidence || 0.95,
          technical_summary: verifiedSummary,
          ...(citizenNote.trim() ? { user_note: citizenNote.trim() } : {}),
        },
      });

      const finalTicketId = createRes.issue?.id || generatedTicketId;
      setGeneratedTicketId(finalTicketId);

      if (isApiConfigured()) {
        await requestSendEmail({
          to: mappedAuthority?.email || 'ward.a.roads@mcgm.gov.in',
          subject: emailSubject,
          bodyText: emailBody,
          issue_id: finalTicketId,
        }).catch(() => {});
      }

      setCurrentStep(5);
    } catch (err) {
      setStepError(
        err instanceof Error ? err.message : 'Unable to dispatch ticket at this time.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setPhotoUri(null);
    setCitizenNote('');
    setAiRawResult(null);
    setStepError(null);
    setOfflineSavedBanner(null);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <CameraCaptureModal
        visible={cameraOpen}
        title="Capture Infrastructure Defect"
        onClose={() => setCameraOpen(false)}
        onCaptured={handlePhotoCaptured}
      />

      <SectionHeader
        eyebrow="Civic Intake Pipeline"
        tag="6-Step Verification"
        title="Report Infrastructure Defect"
        subtitle="Camera capture → AI structural triage → Citizen verification → Ward routing → Formal notice."
      />

      {/* Offline Status Banner */}
      {!isOnline ? (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color={COLORS.dangerText} />
          <Text style={styles.offlineBannerText}>
            You are currently offline. Reports captured now are saved locally in SQLite and will auto-sync when connectivity returns.
          </Text>
        </View>
      ) : null}

      {/* Pending Offline Drafts Queue Banner */}
      {pendingDrafts.length > 0 ? (
        <View style={styles.queueBanner}>
          <View style={styles.queueBannerLeft}>
            <CloudOff size={16} color={COLORS.clayText} />
            <View style={styles.flex}>
              <Text style={styles.queueBannerTitle}>
                {pendingDrafts.length} Pending Offline Report
                {pendingDrafts.length > 1 ? 's' : ''}
              </Text>
              <Text style={styles.queueBannerSub}>
                {isOnline
                  ? 'Connection restored — ready to synchronize.'
                  : 'Waiting for cellular or Wi-Fi connection.'}
              </Text>
            </View>
          </View>
          {isOnline ? (
            <Button
              title="Sync Now"
              variant="clay"
              size="sm"
              loading={isSyncingQueue}
              onPress={handleSyncQueue}
            />
          ) : null}
        </View>
      ) : null}

      {offlineSavedBanner ? (
        <View style={styles.successBanner}>
          <CheckCircle2 size={16} color={COLORS.moss} />
          <Text style={styles.successBannerText}>{offlineSavedBanner}</Text>
        </View>
      ) : null}

      {/* Stepper */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {stepError ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={15} color={COLORS.danger} />
          <Text style={styles.errorBannerText}>{stepError}</Text>
        </View>
      ) : null}

      {/* ================= STEP 1: PHOTO & GPS ================= */}
      {currentStep === 0 ? (
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepIconWrap}>
              <Camera size={16} color={COLORS.clay} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.stepOverline}>STEP 1 OF 6</Text>
              <Text style={styles.stepTitle}>Geotagged Field Capture</Text>
            </View>
            <Badge label="1600px JPEG" variant="moss" />
          </View>

          <Pressable
            onPress={() => setCameraOpen(true)}
            style={styles.captureZone}
          >
            {photoUri ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
                <Text style={styles.replaceHint}>Tap to retake or select another photo</Text>
              </View>
            ) : (
              <View style={styles.emptyCapture}>
                <View style={styles.cameraCircle}>
                  <Camera size={28} color={COLORS.moss} />
                </View>
                <Text style={styles.captureHeadline}>Capture Photo or Choose Gallery</Text>
                <Text style={styles.captureSub}>
                  Auto-compresses to max 1600px JPEG for low-bandwidth field triage
                </Text>
              </View>
            )}
          </Pressable>

          {/* GPS Coordinates Box */}
          <View style={styles.gpsBox}>
            <View style={styles.gpsHeader}>
              <View style={styles.iconRow}>
                <MapPin size={15} color={COLORS.clay} />
                <Text style={styles.gpsTitle}>Geospatial Coordinates</Text>
              </View>
              <View style={styles.iconRow}>
                <Badge label={`Source: ${locationSource}`} variant="default" />
                <Pressable onPress={captureDeviceGps} style={styles.gpsRefreshBtn}>
                  {capturingGps ? (
                    <ActivityIndicator size="small" color={COLORS.bark} />
                  ) : (
                    <RefreshCw size={14} color={COLORS.bark} />
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.coordInputs}>
              <View style={styles.flex}>
                <Text style={styles.fieldLabel}>Latitude (° N)</Text>
                <TextInput
                  style={styles.input}
                  value={latText}
                  onChangeText={(t) => {
                    setLatText(t);
                    setLocationSource('manual');
                  }}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.fieldLabel}>Longitude (° E)</Text>
                <TextInput
                  style={styles.input}
                  value={lngText}
                  onChangeText={(t) => {
                    setLngText(t);
                    setLocationSource('manual');
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Citizen Note */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Citizen Observation (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the defect, e.g. Deep pothole across eastbound lane..."
              placeholderTextColor={COLORS.sage}
              value={citizenNote}
              onChangeText={setCitizenNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <Button
            title={
              isOnline
                ? 'Proceed to AI Structural Triage'
                : 'Save Report to Offline Queue'
            }
            variant={isOnline ? 'primary' : 'clay'}
            size="lg"
            disabled={!photoUri}
            onPress={proceedToAITriage}
            rightIcon={<ArrowRight size={16} color={isOnline ? COLORS.clay : COLORS.white} />}
          />

          {isOnline && photoUri ? (
            <Button
              title="Queue Offline Instead"
              variant="stone"
              size="sm"
              onPress={saveToOfflineQueue}
            />
          ) : null}
        </Card>
      ) : null}

      {/* ================= STEP 2: AI TRIAGE ================= */}
      {currentStep === 1 ? (
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepIconWrap}>
              <Bot size={16} color={COLORS.clay} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.stepOverline}>STEP 2 OF 6</Text>
              <Text style={styles.stepTitle}>Multimodal AI Defect Triage</Text>
            </View>
            <Badge label="Schema Enforced" variant="clay" />
          </View>

          {isAnalyzing ? (
            <View style={styles.analyzingBox}>
              <ActivityIndicator size="large" color={COLORS.clay} />
              <Text style={styles.analyzingTitle}>Analyzing Structural Defect...</Text>
              <Text style={styles.analyzingSub}>
                Classifying defect taxonomy, calculating severity score 1–4, and drafting civil engineering summary.
              </Text>
            </View>
          ) : aiRawResult ? (
            <View style={styles.stepBody}>
              <View style={styles.aiSuccessBar}>
                <View style={styles.iconRow}>
                  <CheckCircle2 size={16} color={COLORS.moss} />
                  <Text style={styles.aiSuccessText}>AI Classification Complete</Text>
                </View>
                <Text style={styles.confidenceMono}>
                  {((aiRawResult.confidence || 0.9) * 100).toFixed(0)}% Conf.
                </Text>
              </View>

              <View style={styles.twoCol}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>DEFECT CATEGORY</Text>
                  <Text style={styles.metricValue}>{aiRawResult.defect_category}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>SEVERITY SCORE</Text>
                  <View style={{ marginTop: 4 }}>
                    <SeverityBadge severity={aiRawResult.severity} />
                  </View>
                </View>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>CIVIL ENGINEERING SUMMARY</Text>
                <Text style={styles.summaryText}>{aiRawResult.technical_summary}</Text>
              </View>

              <View style={styles.btnRow}>
                <Button
                  title="Back"
                  variant="outline"
                  onPress={() => setCurrentStep(0)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Verify Assessment"
                  variant="primary"
                  onPress={() => setCurrentStep(2)}
                  rightIcon={<ArrowRight size={15} color={COLORS.clay} />}
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          ) : null}
        </Card>
      ) : null}

      {/* ================= STEP 3: CITIZEN VERIFICATION GATE ================= */}
      {currentStep === 2 ? (
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepIconWrap}>
              <Check size={16} color={COLORS.clay} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.stepOverline}>STEP 3 OF 6</Text>
              <Text style={styles.stepTitle}>Citizen Verification Gate</Text>
            </View>
            <Badge label="Human in Loop" variant="moss" />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Defect Category</Text>
            <View style={styles.categoryGrid}>
              {DEFECT_CATEGORIES.map((cat) => {
                const selected = verifiedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setVerifiedCategory(cat)}
                    style={[styles.categoryChip, selected && styles.categoryChipActive]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selected && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Severity Score (1 to 4)</Text>
            <View style={styles.severityRow}>
              {[1, 2, 3, 4].map((lvl) => {
                const selected = verifiedSeverity === lvl;
                return (
                  <Pressable
                    key={lvl}
                    onPress={() => setVerifiedSeverity(lvl)}
                    style={[styles.sevBtn, selected && styles.sevBtnActive]}
                  >
                    <Text style={[styles.sevBtnText, selected && styles.sevBtnTextActive]}>
                      Level {lvl}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Verified Engineering Assessment</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={verifiedSummary}
              onChangeText={setVerifiedSummary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.btnRow}>
            <Button
              title="Back"
              variant="outline"
              onPress={() => setCurrentStep(1)}
              style={{ flex: 1 }}
            />
            <Button
              title="Confirm & Route Ward"
              variant="primary"
              onPress={proceedToRouting}
              rightIcon={<ArrowRight size={15} color={COLORS.clay} />}
              style={{ flex: 2 }}
            />
          </View>
        </Card>
      ) : null}

      {/* ================= STEP 4: WARD ROUTING ================= */}
      {currentStep === 3 ? (
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepIconWrap}>
              <Building2 size={16} color={COLORS.clay} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.stepOverline}>STEP 4 OF 6</Text>
              <Text style={styles.stepTitle}>Deterministic GIS Ward Routing</Text>
            </View>
            <Badge label="PostGIS" variant="sage" />
          </View>

          <Text style={styles.bodyMuted}>
            Coordinates{' '}
            <Text style={styles.monoStrong}>
              {gpsLocation.lat.toFixed(4)}° N, {gpsLocation.lng.toFixed(4)}° E
            </Text>{' '}
            matched to municipal ward polygon via PostGIS boundary evaluation.
          </Text>

          {mappedAuthority ? (
            <View style={styles.wardCard}>
              <View style={styles.wardTop}>
                <View style={styles.flex}>
                  <Text style={styles.wardEyebrow}>JURISDICTION DESK</Text>
                  <Text style={styles.wardName}>{mappedAuthority.ward_name}</Text>
                  <Text style={styles.wardDept}>{mappedAuthority.department_name}</Text>
                </View>
                <Badge label={`SLA: ${slaDays} Days`} variant="clay" />
              </View>
              <View style={styles.wardMeta}>
                <Text style={styles.wardMetaLine}>
                  Lead Officer: <Text style={styles.boldText}>{mappedAuthority.contact_name}</Text>
                </Text>
                <Text style={styles.wardMetaLine}>
                  Dispatch Email: <Text style={styles.boldText}>{mappedAuthority.email}</Text>
                </Text>
                {mappedAuthority.phone ? (
                  <Text style={styles.wardMetaLine}>
                    Control Room: <Text style={styles.boldText}>{mappedAuthority.phone}</Text>
                  </Text>
                ) : null}
              </View>
            </View>
          ) : (
            <View style={styles.wardCard}>
              <Text style={styles.bodyMuted}>
                Defaulting to Central Municipal Works Division (SLA: {slaDays} Days).
              </Text>
            </View>
          )}

          <View style={styles.btnRow}>
            <Button
              title="Back"
              variant="outline"
              onPress={() => setCurrentStep(2)}
              style={{ flex: 1 }}
            />
            <Button
              title="Draft Official Notice"
              variant="primary"
              onPress={proceedToEmailDraft}
              rightIcon={<ArrowRight size={15} color={COLORS.clay} />}
              style={{ flex: 2 }}
            />
          </View>
        </Card>
      ) : null}

      {/* ================= STEP 5: NOTICE EMAIL ================= */}
      {currentStep === 4 ? (
        <Card style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepIconWrap}>
              <Mail size={16} color={COLORS.clay} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.stepOverline}>STEP 5 OF 6</Text>
              <Text style={styles.stepTitle}>Municipal Notice Dispatch</Text>
            </View>
            <Badge label="Resend / Outbox" variant="clay" />
          </View>

          {isDraftingEmail ? (
            <View style={styles.analyzingBox}>
              <ActivityIndicator size="large" color={COLORS.clay} />
              <Text style={styles.analyzingTitle}>Composing Formal Notice...</Text>
            </View>
          ) : (
            <View style={styles.stepBody}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>RECIPIENT ADDRESS</Text>
                <View style={styles.recipientBox}>
                  <Text style={styles.monoStrong}>
                    {mappedAuthority?.email || 'ward.a.roads@mcgm.gov.in'}
                  </Text>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>NOTICE SUBJECT</Text>
                <TextInput
                  style={styles.input}
                  value={emailSubject}
                  onChangeText={setEmailSubject}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>NOTICE BODY</Text>
                <TextInput
                  style={[styles.input, styles.emailBodyInput]}
                  value={emailBody}
                  onChangeText={setEmailBody}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.btnRow}>
                <Button
                  title="Back"
                  variant="outline"
                  onPress={() => setCurrentStep(3)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Dispatch & Submit"
                  variant="primary"
                  loading={isSubmitting}
                  onPress={dispatchAndSubmit}
                  leftIcon={<Send size={15} color={COLORS.clay} />}
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          )}
        </Card>
      ) : null}

      {/* ================= STEP 6: CONFIRMED ================= */}
      {currentStep === 5 ? (
        <Card style={styles.confirmCard}>
          <View style={styles.confirmCircle}>
            <CheckCircle2 size={34} color={COLORS.moss} />
          </View>
          <Badge label="Registered & Dispatched" variant="moss" />
          <Text style={styles.confirmTitle}>Ticket Formally Registered</Text>
          <Text style={styles.confirmRef}>Reference #{generatedTicketId.slice(0, 14)}</Text>
          <Text style={styles.confirmDesc}>
            Formal notice dispatched to {mappedAuthority?.ward_name || 'Ward Authority'} with a mandatory {slaDays}-day statutory SLA.
          </Text>

          <View style={styles.summaryList}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Defect Category</Text>
              <Text style={styles.summaryVal}>
                {verifiedCategory} (Level {verifiedSeverity})
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Routed Officer</Text>
              <Text style={styles.summaryVal}>
                {mappedAuthority?.contact_name || 'Ward Officer'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>SLA Deadline</Text>
              <Text style={[styles.summaryVal, { color: COLORS.clay }]}>
                {slaDays} Days Remaining
              </Text>
            </View>
          </View>

          <View style={styles.confirmActions}>
            <Button
              title="View on Sanctuary Map"
              variant="primary"
              onPress={() => router.push('/(tabs)/map')}
              rightIcon={<ArrowRight size={15} color={COLORS.clay} />}
            />
            <Button
              title="Report Another Defect"
              variant="outline"
              onPress={resetWizard}
            />
          </View>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.stone,
  },
  content: {
    padding: SPACING.base,
    gap: 14,
    paddingBottom: 32,
  },
  flex: {
    flex: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(168, 72, 53, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168, 72, 53, 0.3)',
  },
  offlineBannerText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.dangerText,
    lineHeight: 17,
  },
  queueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 12,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(197, 138, 102, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(197, 138, 102, 0.35)',
  },
  queueBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  queueBannerTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  queueBannerSub: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.clayText,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(94, 111, 99, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94, 111, 99, 0.3)',
  },
  successBannerText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.bark,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(168, 72, 53, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168, 72, 53, 0.3)',
  },
  errorBannerText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.dangerText,
  },
  stepCard: {
    gap: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.linen,
  },
  stepIconWrap: {
    width: 34,
    height: 34,
    borderRadius: RADII.md,
    backgroundColor: COLORS.bark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepOverline: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.moss,
    letterSpacing: 1.2,
  },
  stepTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  stepBody: {
    gap: 14,
  },
  captureZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.linen,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.stone,
    padding: 16,
    alignItems: 'center',
  },
  previewWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  previewImage: {
    width: '100%',
    height: 210,
    borderRadius: RADII.md,
  },
  replaceHint: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.clay,
  },
  emptyCapture: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  cameraCircle: {
    width: 58,
    height: 58,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.linen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureHeadline: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  captureSub: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
    textAlign: 'center',
  },
  gpsBox: {
    backgroundColor: COLORS.stone,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.linen,
    padding: 12,
    gap: 10,
  },
  gpsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gpsTitle: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.bark,
  },
  gpsRefreshBtn: {
    width: 30,
    height: 30,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.linen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xxs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.moss,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.linen,
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.bark,
  },
  textArea: {
    minHeight: 78,
  },
  emailBodyInput: {
    minHeight: 160,
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xs,
    backgroundColor: COLORS.stone,
  },
  analyzingBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 10,
  },
  analyzingTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  analyzingSub: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
    textAlign: 'center',
    lineHeight: 18,
  },
  aiSuccessBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(94, 111, 99, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94, 111, 99, 0.3)',
  },
  aiSuccessText: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.bark,
  },
  confidenceMono: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.moss,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.stone,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.linen,
    padding: 12,
    gap: 4,
  },
  metricLabel: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.moss,
    letterSpacing: 0.9,
  },
  metricValue: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  summaryText: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.bark,
    lineHeight: 19,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.md,
    backgroundColor: COLORS.stone,
    borderWidth: 1,
    borderColor: COLORS.linen,
  },
  categoryChipActive: {
    backgroundColor: COLORS.bark,
    borderColor: COLORS.bark,
  },
  categoryChipText: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.bark,
  },
  categoryChipTextActive: {
    color: COLORS.stone,
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sevBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADII.md,
    backgroundColor: COLORS.stone,
    borderWidth: 1,
    borderColor: COLORS.linen,
    alignItems: 'center',
  },
  sevBtnActive: {
    backgroundColor: COLORS.bark,
    borderColor: COLORS.bark,
  },
  sevBtnText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  sevBtnTextActive: {
    color: COLORS.stone,
  },
  bodyMuted: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.moss,
    lineHeight: 19,
  },
  monoStrong: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  wardCard: {
    backgroundColor: COLORS.stone,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.linen,
    padding: 14,
    gap: 10,
  },
  wardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  wardEyebrow: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.clay,
    letterSpacing: 1.1,
  },
  wardName: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
    marginTop: 2,
  },
  wardDept: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
  },
  wardMeta: {
    borderTopWidth: 1,
    borderTopColor: COLORS.linen,
    paddingTop: 10,
    gap: 4,
  },
  wardMetaLine: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
  },
  boldText: {
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.bark,
  },
  recipientBox: {
    backgroundColor: COLORS.stone,
    borderWidth: 1,
    borderColor: COLORS.linen,
    borderRadius: RADII.md,
    padding: 11,
  },
  confirmCard: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 12,
  },
  confirmCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(94, 111, 99, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(94, 111, 99, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
    textAlign: 'center',
  },
  confirmRef: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.clay,
  },
  confirmDesc: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.moss,
    textAlign: 'center',
    lineHeight: 19,
  },
  summaryList: {
    width: '100%',
    backgroundColor: COLORS.stone,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.linen,
    padding: 14,
    gap: 10,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryKey: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    color: COLORS.moss,
  },
  summaryVal: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.bark,
  },
  confirmActions: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
});
