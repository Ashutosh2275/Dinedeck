/**
 * DineDeck Food Photography Client-Side Image Optimizer
 * 
 * Automatically resizes and compresses oversized food images into high-quality WebP format
 * enforcing a strict maximum size ceiling of 200 KB per image.
 */

export interface OptimizedImageResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  sizeKb: number;
  originalSizeBytes: number;
  compressionRatio: number;
  format: 'webp' | 'jpeg';
}

const MAX_UPLOAD_BYTES = 200 * 1024; // 200 KB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates file type and initial size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload a JPG, PNG, or WebP image.'
    };
  }

  // Prevent browser crash from excessively large camera RAW or 50MB files
  if (file.size > 20 * 1024 * 1024) {
    return {
      valid: false,
      error: 'File size too large. Please select an image under 20 MB.'
    };
  }

  return { valid: true };
}

/**
 * Helper to read a File/Blob as Data URL
 */
function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Helper to load an HTMLImageElement from a URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image data'));
    img.src = src;
  });
}

/**
 * Automatically resize & compress an image to WebP <= 200 KB
 */
export async function compressAndOptimizeFoodImage(
  file: File,
  maxSizeBytes: number = MAX_UPLOAD_BYTES
): Promise<OptimizedImageResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const initialDataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(initialDataUrl);

  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;

  if (originalWidth < 50 || originalHeight < 50) {
    throw new Error('Image dimensions too small. Minimum resolution is 50x50 pixels.');
  }

  // Compression & Downscaling Ladder
  // Step 1: 1200px @ 0.85
  // Step 2: 1000px @ 0.75
  // Step 3: 900px  @ 0.65
  // Step 4: 800px  @ 0.55
  // Step 5: 640px  @ 0.45
  // Step 6: 500px  @ 0.40
  const steps = [
    { maxDim: 1200, quality: 0.85 },
    { maxDim: 1000, quality: 0.75 },
    { maxDim: 900,  quality: 0.65 },
    { maxDim: 800,  quality: 0.55 },
    { maxDim: 640,  quality: 0.45 },
    { maxDim: 500,  quality: 0.40 }
  ];

  let bestBlob: Blob | null = null;
  let finalWidth = originalWidth;
  let finalHeight = originalHeight;
  let finalFormat: 'webp' | 'jpeg' = 'webp';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  for (const step of steps) {
    // Calculate aspect ratio preserving bounds
    let width = originalWidth;
    let height = originalHeight;

    if (width > step.maxDim || height > step.maxDim) {
      if (width > height) {
        height = Math.round((height * step.maxDim) / width);
        width = step.maxDim;
      } else {
        width = Math.round((width * step.maxDim) / height);
        height = step.maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Attempt WebP export
    const candidateBlob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob(
        (b) => {
          if (b && b.type === 'image/webp') {
            resolve(b);
          } else {
            // WebP not supported in browser canvas -> fallback to JPEG
            canvas.toBlob((jb) => resolve(jb), 'image/jpeg', step.quality);
          }
        },
        'image/webp',
        step.quality
      );
    });

    if (candidateBlob) {
      finalFormat = candidateBlob.type === 'image/webp' ? 'webp' : 'jpeg';
      if (candidateBlob.size <= maxSizeBytes) {
        bestBlob = candidateBlob;
        finalWidth = width;
        finalHeight = height;
        break;
      }
    }
  }

  // If still oversized, perform extreme downscale (400px @ 0.35)
  if (!bestBlob) {
    let width = originalWidth;
    let height = originalHeight;
    const maxDim = 400;
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    bestBlob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/webp', 0.35);
    });
    finalWidth = width;
    finalHeight = height;
  }

  if (!bestBlob || bestBlob.size > maxSizeBytes) {
    throw new Error(
      `Image exceeds maximum upload limit of ${maxSizeBytes / 1024} KB even after compression.`
    );
  }

  const finalDataUrl = await readFileAsDataUrl(bestBlob);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const finalFilename = `${baseName}.${finalFormat}`;
  const finalFile = new File([bestBlob], finalFilename, {
    type: bestBlob.type,
    lastModified: Date.now()
  });

  const compressionRatio = Number((((file.size - bestBlob.size) / file.size) * 100).toFixed(1));

  return {
    file: finalFile,
    blob: bestBlob,
    dataUrl: finalDataUrl,
    width: finalWidth,
    height: finalHeight,
    sizeBytes: bestBlob.size,
    sizeKb: Number((bestBlob.size / 1024).toFixed(1)),
    originalSizeBytes: file.size,
    compressionRatio: Math.max(0, compressionRatio),
    format: finalFormat
  };
}
