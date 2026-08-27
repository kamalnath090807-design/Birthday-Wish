import { Hono } from 'hono';
import { Env } from '../types.js';

export const mediaRoutes = new Hono<{ Bindings: Env }>();

// POST /api/upload - Handle media upload (with optional Cloudinary free storage)
mediaRoutes.post('/', async (c) => {
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

    // Check size limit: 15 MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (blob.size > MAX_SIZE) {
      return c.json({ error: 'File size exceeds 15MB limit' }, 400);
    }

    const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedMimes = [...allowedImageMimes, ...allowedVideoMimes];

    if (!allowedMimes.includes(blob.type)) {
      return c.json(
        { error: `Unsupported file type (${blob.type}). Please upload JPG, PNG, WEBP or MP4.` },
        400
      );
    }

    const isVideo = blob.type.startsWith('video/');
    const cloudName = c.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = c.env.CLOUDINARY_API_KEY;
    const uploadPreset = c.env.CLOUDINARY_UPLOAD_PRESET || 'unsigned_birthday';

    // Optional free external storage integration (e.g. Cloudinary)
    if (cloudName) {
      try {
        const cFormData = new FormData();
        cFormData.append('file', blob);
        cFormData.append('upload_preset', uploadPreset);
        if (apiKey) {
          cFormData.append('api_key', apiKey);
        }

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? 'video' : 'image'}/upload`,
          {
            method: 'POST',
            body: cFormData,
          }
        );

        if (cloudRes.ok) {
          const cloudData = (await cloudRes.json()) as any;
          return c.json({
            url: cloudData.secure_url,
            type: isVideo ? 'video' : 'image',
            filename: cloudData.public_id || `upload-${Date.now()}`,
            size: blob.size,
            mimetype: blob.type,
          });
        }
      } catch (err) {
        console.error('Cloudinary upload error:', err);
      }
    }

    // Graceful response when external media storage is not configured
    return c.json(
      {
        error: 'Media uploads are not currently configured. You can still send a text wish.',
      },
      503
    );
  } catch (err: any) {
    console.error('Upload error:', err);
    return c.json({ error: err.message || 'File upload failed' }, 500);
  }
});
