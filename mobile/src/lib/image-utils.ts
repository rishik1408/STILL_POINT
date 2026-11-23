// ============================================================
// STILL POINT Mobile Image Processing
// Compresses captured/selected photos to max 1600px JPEG via
// Expo SDK 58 ImageManipulator contextual API.
// ============================================================

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export const MAX_IMAGE_DIMENSION = 1600;
export const JPEG_QUALITY = 0.8;

export interface CompressedPhotoResult {
  uri: string;
  width: number;
  height: number;
}

/**
 * Compresses and resizes a photo URI to at most 1600px on its longest edge as JPEG.
 */
export async function compressPhotoToJpeg(
  uri: string,
  originalWidth?: number,
  originalHeight?: number
): Promise<CompressedPhotoResult> {
  const context = ImageManipulator.manipulate(uri);

  if (originalWidth && originalHeight) {
    if (originalWidth >= originalHeight && originalWidth > MAX_IMAGE_DIMENSION) {
      context.resize({ width: MAX_IMAGE_DIMENSION });
    } else if (originalHeight > originalWidth && originalHeight > MAX_IMAGE_DIMENSION) {
      context.resize({ height: MAX_IMAGE_DIMENSION });
    }
  } else {
    // Resize width to max 1600px while preserving aspect ratio
    context.resize({ width: MAX_IMAGE_DIMENSION });
  }

  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });

  return {
    uri: saved.uri,
    width: saved.width,
    height: saved.height,
  };
}
