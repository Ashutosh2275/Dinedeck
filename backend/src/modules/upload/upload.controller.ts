import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { prisma } from '../../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads directory: backend/public/uploads/menu-items
const UPLOADS_DIR = path.resolve(__dirname, '../../../public/uploads/menu-items');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Strict constants
const MAX_UPLOAD_SIZE_BYTES = 200 * 1024; // 200 KB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates magic bytes for JPG, PNG, and WebP
 */
function isValidImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // WebP: 'RIFF'....'WEBP'
  const riff = buffer.toString('ascii', 0, 4);
  const webp = buffer.toString('ascii', 8, 12);
  if (riff === 'RIFF' && webp === 'WEBP') {
    return true;
  }

  return false;
}

/**
 * Compresses an image buffer into WebP strictly <= 200 KB
 */
async function compressToWebPUnder200KB(inputBuffer: Buffer): Promise<{
  mainBuffer: Buffer;
  thumbBuffer: Buffer;
  width: number;
  height: number;
}> {
  const metadata = await sharp(inputBuffer).metadata();
  if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format)) {
    throw new Error('Unsupported image format. Only JPG, PNG, and WebP are allowed.');
  }

  const initialWidth = metadata.width || 800;
  const initialHeight = metadata.height || 600;

  if (initialWidth < 50 || initialHeight < 50) {
    throw new Error('Image dimensions too small. Minimum size is 50x50 pixels.');
  }

  // Progressive compression steps to guarantee <= 200 KB with optimum food photography quality
  const compressionProfiles = [
    { maxDim: 1200, quality: 82, effort: 4 },
    { maxDim: 1000, quality: 75, effort: 5 },
    { maxDim: 900, quality: 68, effort: 5 },
    { maxDim: 800, quality: 60, effort: 6 },
    { maxDim: 640, quality: 50, effort: 6 },
    { maxDim: 500, quality: 40, effort: 6 }
  ];

  let bestBuffer: Buffer | null = null;
  let finalWidth = initialWidth;
  let finalHeight = initialHeight;

  for (const profile of compressionProfiles) {
    const pipeline = sharp(inputBuffer)
      .rotate() // Auto-orient based on EXIF
      .resize({
        width: profile.maxDim,
        height: profile.maxDim,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({
        quality: profile.quality,
        effort: profile.effort
      });

    const candidate = await pipeline.toBuffer();
    if (candidate.length <= MAX_UPLOAD_SIZE_BYTES) {
      bestBuffer = candidate;
      const finalMeta = await sharp(candidate).metadata();
      finalWidth = finalMeta.width || profile.maxDim;
      finalHeight = finalMeta.height || profile.maxDim;
      break;
    }
  }

  if (!bestBuffer) {
    // Last-ditch attempt: downscale to 400px at quality 35
    bestBuffer = await sharp(inputBuffer)
      .rotate()
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 35, effort: 6 })
      .toBuffer();

    if (bestBuffer.length > MAX_UPLOAD_SIZE_BYTES) {
      throw new Error(`Image could not be compressed below ${MAX_UPLOAD_SIZE_BYTES / 1024} KB limit`);
    }
    const finalMeta = await sharp(bestBuffer).metadata();
    finalWidth = finalMeta.width || 400;
    finalHeight = finalMeta.height || 400;
  }

  // Generate lightweight responsive thumbnail (320x240 WebP) for low-end mobile devices & fast lists
  const thumbBuffer = await sharp(bestBuffer)
    .resize(320, 240, { fit: 'cover', position: 'center' })
    .webp({ quality: 75, effort: 4 })
    .toBuffer();

  return {
    mainBuffer: bestBuffer,
    thumbBuffer,
    width: finalWidth,
    height: finalHeight
  };
}

export async function uploadRoutes(fastify: FastifyInstance) {
  // Health & directory verification
  fastify.get('/health', async (_req, reply) => {
    return reply.send({
      status: 'healthy',
      maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
      maxSizeKb: 200,
      supportedFormats: ['webp', 'jpeg', 'png'],
      storagePath: UPLOADS_DIR,
      storageAccessible: fs.existsSync(UPLOADS_DIR)
    });
  });

  // Upload Food Item Image (Supports both Multipart & Base64 JSON)
  fastify.post('/food-item-image', { preHandler: [fastify.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (req as any).user;

    let rawBuffer: Buffer | null = null;
    let restaurantId: string = userAuth.restaurantId || 'global';
    let itemId: string | undefined;

    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      // Multipart upload
      const fileData = await (req as any).file();
      if (!fileData) {
        return reply.status(400).send({ success: false, message: 'No image file provided in multipart form' });
      }

      rawBuffer = await fileData.toBuffer();
      if (fileData.fields?.restaurantId?.value) {
        restaurantId = fileData.fields.restaurantId.value;
      }
      if (fileData.fields?.itemId?.value) {
        itemId = fileData.fields.itemId.value;
      }
    } else {
      // JSON with Base64 payload
      const body = req.body as any;
      if (!body || (!body.imageBase64 && !body.data)) {
        return reply.status(400).send({
          success: false,
          message: 'Missing image data. Provide image file or imageBase64 data URL.'
        });
      }

      const base64Data = (body.imageBase64 || body.data).replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      rawBuffer = Buffer.from(base64Data, 'base64');

      if (body.restaurantId) restaurantId = body.restaurantId;
      if (body.itemId) itemId = body.itemId;
    }

    if (!rawBuffer || rawBuffer.length === 0) {
      return reply.status(400).send({ success: false, message: 'Empty or corrupted image buffer' });
    }

    // Safety limit on initial buffer size (e.g. 15 MB) to prevent denial-of-service
    if (rawBuffer.length > 15 * 1024 * 1024) {
      return reply.status(400).send({
        success: false,
        message: 'Original image is too large (maximum 15 MB allowed for raw upload)'
      });
    }

    // Magic byte validation
    if (!isValidImageMagicBytes(rawBuffer)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid file format. Only legitimate JPG, PNG, and WebP images are allowed.'
      });
    }

    // Compress & optimize image to WebP strictly <= 200 KB
    let optimized;
    try {
      optimized = await compressToWebPUnder200KB(rawBuffer);
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: `Image optimization failed: ${err.message}`
      });
    }

    // Final backend strict size verification
    if (optimized.mainBuffer.length > MAX_UPLOAD_SIZE_BYTES) {
      return reply.status(400).send({
        success: false,
        message: `Image exceeds maximum allowed size of 200 KB (actual: ${(optimized.mainBuffer.length / 1024).toFixed(1)} KB)`
      });
    }

    // Generate safe, collision-resistant filenames
    const sanitizedRestId = restaurantId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
    const randomSalt = crypto.randomBytes(6).toString('hex');
    const timestamp = Date.now();
    const mainFilename = `food_${sanitizedRestId}_${timestamp}_${randomSalt}.webp`;
    const thumbFilename = `food_${sanitizedRestId}_${timestamp}_${randomSalt}_thumb.webp`;

    const mainFilePath = path.join(UPLOADS_DIR, mainFilename);
    const thumbFilePath = path.join(UPLOADS_DIR, thumbFilename);

    await fs.promises.writeFile(mainFilePath, optimized.mainBuffer);
    await fs.promises.writeFile(thumbFilePath, optimized.thumbBuffer);

    const imageUrl = `/uploads/menu-items/${mainFilename}`;
    const thumbnailUrl = `/uploads/menu-items/${thumbFilename}`;

    // If itemId was provided, associate with the database MenuItem immediately
    if (itemId) {
      try {
        await prisma.menuItem.update({
          where: { id: itemId },
          data: { imageUrl }
        });

        // Realtime notification
        const { realtimeHub } = await import('../../realtime/websocket.js');
        realtimeHub.notifyRestaurantStaff(restaurantId, 'MENU_ITEM_UPDATED', {
          itemId,
          imageUrl,
          thumbnailUrl
        });
      } catch (dbErr: any) {
        fastify.log.warn(`Could not auto-associate image to itemId ${itemId}: ${dbErr.message}`);
      }
    }

    return reply.status(201).send({
      success: true,
      message: `Food image optimized and uploaded successfully (${(optimized.mainBuffer.length / 1024).toFixed(1)} KB WebP)`,
      imageUrl,
      thumbnailUrl,
      sizeBytes: optimized.mainBuffer.length,
      sizeKb: Number((optimized.mainBuffer.length / 1024).toFixed(1)),
      thumbSizeBytes: optimized.thumbBuffer.length,
      thumbSizeKb: Number((optimized.thumbBuffer.length / 1024).toFixed(1)),
      format: 'webp',
      width: optimized.width,
      height: optimized.height
    });
  });
}
