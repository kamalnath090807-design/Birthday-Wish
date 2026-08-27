import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { Env } from '../types.js';

export const mediaRoutes = new Hono<{ Bindings: Env }>();

// 1. Upload media (Image or Video) to Cloudflare R2
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
    const origName = blob.name || 'file';
    const extMatch = origName.lastIndexOf('.') !== -1 ? origName.slice(origName.lastIndexOf('.')) : (isVideo ? '.mp4' : '.jpg');
    const safeKey = `${Date.now()}-${nanoid(8)}${extMatch.toLowerCase()}`;

    // Store in Cloudflare R2
    if (!c.env.MEDIA) {
      return c.json({ error: 'Media storage (R2) binding is not configured' }, 500);
    }

    await c.env.MEDIA.put(safeKey, blob.stream(), {
      httpMetadata: {
        contentType: blob.type,
      },
      customMetadata: {
        originalName: origName,
        size: String(blob.size),
      },
    });

    const fileUrl = `/media/${safeKey}`;

    return c.json({
      url: fileUrl,
      type: isVideo ? 'video' : 'image',
      filename: safeKey,
      size: blob.size,
      mimetype: blob.type,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return c.json({ error: err.message || 'File upload failed' }, 500);
  }
});

// 2. Stream Media directly from Cloudflare R2 with HTTP Range support
mediaRoutes.get('/:key', async (c) => {
  try {
    const key = c.req.param('key');
    if (!c.env.MEDIA) {
      return c.text('Media storage not configured', 500);
    }

    const rangeHeader = c.req.header('range');
    const object = rangeHeader
      ? await c.env.MEDIA.get(key, { range: c.req.raw.headers })
      : await c.env.MEDIA.get(key);

    if (!object) {
      return c.text('File not found', 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Accept-Ranges', 'bytes');

    if (!headers.has('Content-Type')) {
      const isVideo = key.endsWith('.mp4') || key.endsWith('.webm') || key.endsWith('.mov');
      headers.set('Content-Type', isVideo ? 'video/mp4' : 'image/jpeg');
    }

    if (object.range) {
      const range = object.range as any;
      if ('offset' in range && 'length' in range) {
        const start = range.offset;
        const end = range.offset + range.length - 1;
        headers.set('Content-Range', `bytes ${start}-${end}/${object.size}`);
        headers.set('Content-Length', String(range.length));
      }
      return new Response(object.body, {
        status: 206,
        headers,
      });
    }

    headers.set('Content-Length', String(object.size));
    return new Response(object.body, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return c.text('Failed to load media', 500);
  }
});
