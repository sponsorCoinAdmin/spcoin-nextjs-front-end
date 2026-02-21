// File: lib/utils/images/imageUploadProcessor.ts

export const ACCEPTED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/heic',
  'image/heic-sequence',
  'image/heif',
  'image/heif-sequence',
  'image/bmp',
  'image/tiff',
  'image/gif',
  'image/avif',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/icns',
  'image/svg+xml',
] as const;

const ACCEPTED_IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.heic',
  '.heics',
  '.heif',
  '.hif',
  '.bmp',
  '.tif',
  '.tiff',
  '.gif',
  '.avif',
  '.ico',
  '.icns',
  '.svg',
]);

export const ACCEPTED_IMAGE_INPUT_ACCEPT = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.heic',
  '.heics',
  '.heif',
  '.hif',
  '.bmp',
  '.tif',
  '.tiff',
  '.gif',
  '.avif',
  '.ico',
  '.icns',
  '.svg',
].join(',');

export type ProcessImageUploadOptions = {
  targetWidth?: number;
  targetHeight?: number;
  maxInputBytes?: number;
  maxOutputBytes?: number;
};

export type ProcessImageUploadResult = {
  file: File;
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: 'image/png';
};

const DEFAULT_TARGET_WIDTH = 400;
const DEFAULT_TARGET_HEIGHT = 400;
const DEFAULT_MAX_INPUT_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_OUTPUT_BYTES = 500 * 1024;

function getExtension(name: string): string {
  const lower = String(name || '').toLowerCase();
  const dotIndex = lower.lastIndexOf('.');
  return dotIndex >= 0 ? lower.slice(dotIndex) : '';
}

function toOutputFileName(name: string): string {
  const raw = String(name || '').trim();
  if (!raw) return 'image-processed.png';
  const dotIndex = raw.lastIndexOf('.');
  const stem = dotIndex > 0 ? raw.slice(0, dotIndex) : raw;
  return `${stem}.png`;
}

function isAcceptedImageFile(file: File): boolean {
  const mime = String(file.type || '').toLowerCase();
  const ext = getExtension(file.name);
  return (
    ACCEPTED_IMAGE_MIME_TYPES.includes(
      mime as (typeof ACCEPTED_IMAGE_MIME_TYPES)[number],
    ) || ACCEPTED_IMAGE_EXTENSIONS.has(ext)
  );
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file);
  } catch {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const nextImg = new Image();
        nextImg.onload = () => resolve(nextImg);
        nextImg.onerror = () =>
          reject(new Error('Unsupported image format for browser decode'));
        nextImg.src = objectUrl;
      });
      return img;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

function getDecodedDimensions(source: ImageBitmap | HTMLImageElement): {
  width: number;
  height: number;
} {
  if ('width' in source && 'height' in source) {
    return { width: source.width, height: source.height };
  }
  return { width: 0, height: 0 };
}

function drawContainTransparent(
  source: ImageBitmap | HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  const { width: srcW, height: srcH } = getDecodedDimensions(source);
  if (!srcW || !srcH) {
    throw new Error('Invalid source image dimensions');
  }

  const scale = Math.min(targetWidth / srcW, targetHeight / srcH);
  const drawW = Math.max(1, Math.round(srcW * scale));
  const drawH = Math.max(1, Math.round(srcH * scale));
  const offsetX = Math.floor((targetWidth - drawW) / 2);
  const offsetY = Math.floor((targetHeight - drawH) / 2);

  // Keep a transparent background and center-fit image into 400x400.
  ctx.clearRect(0, 0, targetWidth, targetHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, offsetX, offsetY, drawW, drawH);

  return canvas;
}

async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), 'image/png'),
  );
  if (!blob) throw new Error('Failed to encode PNG output');
  return blob;
}

export async function processImageUpload(
  file: File,
  options?: ProcessImageUploadOptions,
): Promise<ProcessImageUploadResult> {
  const targetWidth = options?.targetWidth ?? DEFAULT_TARGET_WIDTH;
  const targetHeight = options?.targetHeight ?? DEFAULT_TARGET_HEIGHT;
  const maxInputBytes = options?.maxInputBytes ?? DEFAULT_MAX_INPUT_BYTES;
  const maxOutputBytes = options?.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;

  if (!(file instanceof File)) {
    throw new Error('Missing image file');
  }
  if (!isAcceptedImageFile(file)) {
    throw new Error('Unsupported image format');
  }
  if (file.size > maxInputBytes) {
    throw new Error(
      `Image exceeds input limit (${Math.round(maxInputBytes / 1024)} KiB max)`,
    );
  }

  const decoded = await decodeImage(file);
  try {
    const canvas = drawContainTransparent(decoded, targetWidth, targetHeight);
    const blob = await canvasToPngBlob(canvas);

    if (blob.size > maxOutputBytes) {
      throw new Error(
        `Processed PNG exceeds ${Math.round(maxOutputBytes / 1024)} KiB limit`,
      );
    }

    const outputFile = new File([blob], toOutputFileName(file.name), {
      type: 'image/png',
      lastModified: Date.now(),
    });

    return {
      file: outputFile,
      blob,
      width: targetWidth,
      height: targetHeight,
      sizeBytes: blob.size,
      mimeType: 'image/png',
    };
  } finally {
    if ('close' in decoded && typeof decoded.close === 'function') {
      decoded.close();
    }
  }
}
