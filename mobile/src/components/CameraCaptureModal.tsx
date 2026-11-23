// ============================================================
// STILL POINT Mobile Camera Capture Modal
// Uses expo-camera (CameraView) with gallery fallback (expo-image-picker)
// and compresses every photo to max 1600px JPEG via expo-image-manipulator.
// ============================================================

import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, RefreshCw, X } from 'lucide-react-native';
import { compressPhotoToJpeg } from '@/lib/image-utils';
import { COLORS, FONT_FAMILIES, FONT_SIZES, FONT_WEIGHTS, RADII } from '@/theme/tokens';
import { Button } from '@/components/ui';

interface CameraCaptureModalProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onCaptured: (result: { uri: string; width: number; height: number }) => void;
}

export function CameraCaptureModal({
  visible,
  title = 'Field Defect Capture',
  onClose,
  onCaptured,
}: CameraCaptureModalProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSnap = async () => {
    if (!cameraRef.current || processing) return;
    setProcessing(true);
    setErrorMsg(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      if (!photo?.uri) {
        setErrorMsg('Unable to capture image. Please retry.');
        return;
      }
      const compressed = await compressPhotoToJpeg(photo.uri, photo.width, photo.height);
      onCaptured(compressed);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Camera capture failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleGalleryPick = async () => {
    if (processing) return;
    setProcessing(true);
    setErrorMsg(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const compressed = await compressPhotoToJpeg(asset.uri, asset.width, asset.height);
        onCaptured(compressed);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gallery selection failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={styles.iconBtn} accessibilityLabel="Close camera">
            <X size={22} color={COLORS.stone} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.subtitleText}>MAX 1600PX JPEG COMPRESSION</Text>
          </View>
          <Pressable
            onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
            style={styles.iconBtn}
            accessibilityLabel="Switch camera"
          >
            <RefreshCw size={20} color={COLORS.stone} />
          </Pressable>
        </View>

        {/* Camera Body */}
        {!permission ? (
          <View style={styles.permissionBox}>
            <ActivityIndicator size="large" color={COLORS.clay} />
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionBox}>
            <View style={styles.permIconCircle}>
              <Camera size={32} color={COLORS.clay} />
            </View>
            <Text style={styles.permTitle}>Camera Permission Required</Text>
            <Text style={styles.permBody}>
              STILL POINT needs camera access to document public infrastructure defects and verify completed repairs.
            </Text>
            <View style={styles.permActions}>
              <Button
                title="Grant Camera Permission"
                variant="clay"
                onPress={() => {
                  requestPermission();
                }}
              />
              <Button
                title="Choose From Gallery Instead"
                variant="stone"
                onPress={handleGalleryPick}
              />
            </View>
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
            {/* Alignment reticle */}
            <View pointerEvents="none" style={styles.reticleOverlay}>
              <View style={styles.reticleFrame} />
            </View>
          </View>
        )}

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Bottom Controls */}
        <View style={styles.bottomBar}>
          <Pressable
            onPress={handleGalleryPick}
            disabled={processing}
            style={styles.galleryBtn}
          >
            <ImageIcon size={20} color={COLORS.stone} />
            <Text style={styles.galleryLabel}>Gallery</Text>
          </Pressable>

          <Pressable
            onPress={handleSnap}
            disabled={processing || !permission?.granted}
            style={({ pressed }) => [
              styles.shutterOuter,
              { opacity: !permission?.granted ? 0.4 : pressed ? 0.8 : 1 },
            ]}
          >
            <View style={styles.shutterInner}>
              {processing ? <ActivityIndicator color={COLORS.bark} /> : null}
            </View>
          </Pressable>

          <View style={styles.spacerBtn} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bark,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.barkLight,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.md,
    backgroundColor: COLORS.barkLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    alignItems: 'center',
  },
  titleText: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.stone,
  },
  subtitleText: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: 9,
    color: COLORS.sage,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  reticleOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },
  reticleFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(197, 138, 102, 0.7)',
    borderStyle: 'dashed',
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 12,
  },
  permIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.barkLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  permTitle: {
    fontFamily: FONT_FAMILIES.serif,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.stone,
    textAlign: 'center',
  },
  permBody: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.md,
    color: COLORS.sage,
    textAlign: 'center',
    lineHeight: 20,
  },
  permActions: {
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
  errorBanner: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 26,
    backgroundColor: COLORS.bark,
    borderTopWidth: 1,
    borderTopColor: COLORS.barkLight,
  },
  galleryBtn: {
    alignItems: 'center',
    gap: 4,
    width: 64,
  },
  galleryLabel: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.xxs,
    color: COLORS.sage,
    textTransform: 'uppercase',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: COLORS.clay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.stone,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacerBtn: {
    width: 64,
  },
});
