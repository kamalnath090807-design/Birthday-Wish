import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { Env } from '../types.js';
import { d1 } from '../db/index.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

export const mediaRoutes = new Hono<{ Bindings: Env }>();

// Maximum size limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_MIMES = [...ALLOWED_IMAGE_MIMES, ...ALLOWED_VIDEO_MIMES];

// POST /api/upload - Handle temporary media upload with 72-hour lifespan
mediaRoutes.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData().catch(() => null);
    if (!formData) {
      return c.json({ error: 'Invalid form data' }, 400);
    }

    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return c.json({ error: 'No file uploaded' }, 400);
    }

    const blob = file as File;

    if (!blob.size || blob.size <= 0) {
      return c.json({ error: 'Uploaded file is empty (0 bytes)' }, 400);
    }

    if (!ALLOWED_MIMES.includes(blob.type)) {
      return c.json(
        { error: `Unsupported file type (${blob.type}). Please upload a valid JPG, PNG, WebP image or MP4/WebM video.` },
        400
      );
    }

    const isVideo = blob.type.startsWith('video/');
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (blob.size > maxSize) {
      return c.json(
        { error: `File size exceeds the limit (${isVideo ? '25MB for videos' : '10MB for photos'})` },
        400
      );
    }

    // Check Cloudinary configuration
    if (!c.env.CLOUDINARY_CLOUD_NAME || (!c.env.CLOUDINARY_UPLOAD_PRESET && (!c.env.CLOUDINARY_API_KEY || !c.env.CLOUDINARY_API_SECRET))) {
      return c.json(
        {
          error: 'Media storage is not configured on the server.',
        },
        503
      );
    }

    // Upload to Cloudinary using signed upload
    const resourceType: 'image' | 'video' = isVideo ? 'video' : 'image';
    const uploadResult = await uploadToCloudinary(blob, resourceType, c.env);

    // Calculate 72-hour (3-day) expiry timestamp
    const EXPIRY_HOURS = 72;
    const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
    const createdAt = new Date().toISOString();

    // Track in temporary_media table
    const tempMediaRecord = {
      id: nanoid(12),
      providerAssetId: uploadResult.asset_id,
      providerPublicId: uploadResult.public_id,
      resourceType,
      mediaUrl: uploadResult.secure_url,
      expiresAt,
      createdAt,
      cleanupStatus: 'pending' as const,
    };

    await d1.addTemporaryMedia(c.env.DB, tempMediaRecord).catch((err) => {
      console.error('[Media Route] Failed to save temporary media record in D1:', err);
    });

    return c.json({
      url: uploadResult.secure_url,
      type: resourceType,
      publicId: uploadResult.public_id,
      assetId: uploadResult.asset_id,
      expiresAt,
    });
  } catch (err: any) {
    console.error('[Media Upload Route Error]', err);
    const status = err.message?.includes('not configured') ? 503 : 502;
    return c.json({ error: err.message || 'Media upload failed' }, status);
  }
});
