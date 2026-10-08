// Browser helpers for getting a photo in and out of a canvas.

import { ANALYSIS_SIZE } from './features';

export type PhotoElement = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;

const STORED_MAX_SIDE = 512;

/** Loads an image from a URL (including data and blob URLs). Rejects when it cannot be decoded. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The image could not be decoded'));
    image.src = src;
  });
}

/** Loads a file the person picked. The temporary URL is released once the image is decoded. */
export async function loadImageFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sizeOf(photo: PhotoElement): { width: number; height: number } {
  if (photo instanceof HTMLVideoElement) return { width: photo.videoWidth, height: photo.videoHeight };
  if (photo instanceof HTMLImageElement) return { width: photo.naturalWidth, height: photo.naturalHeight };
  return { width: photo.width, height: photo.height };
}

function draw(photo: PhotoElement, width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('This browser cannot draw to a canvas');
  // Transparent areas become white instead of black
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(photo, 0, 0, width, height);
  return context;
}

/**
 * The photo squeezed to the square the model was trained on, as RGBA pixels.
 * Every photo is measured at this one size, so a 12-megapixel photo and a
 * small copy of it give the same result.
 */
export function analysisPixels(photo: PhotoElement): Uint8ClampedArray {
  return draw(photo, ANALYSIS_SIZE, ANALYSIS_SIZE).getImageData(0, 0, ANALYSIS_SIZE, ANALYSIS_SIZE).data;
}

/** A small JPEG copy (longest side 512 px) to keep in history. */
export function storedPhotoOf(photo: PhotoElement): string {
  const { width, height } = sizeOf(photo);
  const scale = Math.min(1, STORED_MAX_SIDE / Math.max(width, height, 1));
  const context = draw(photo, Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
  return context.canvas.toDataURL('image/jpeg', 0.85);
}
