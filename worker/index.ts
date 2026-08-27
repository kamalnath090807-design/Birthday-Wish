import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types.js';
import { validateAndNormalizeIndianPhone } from './utils/phone.js';
import { birthdayRoutes } from './routes/birthdays.js';
import { mediaRoutes } from './routes/media.js';
import { runMediaCleanup } from './services/cleanup.js';

export const app = new Hono<{ Bindings: Env }>();

// 1. CORS middleware
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposeHeaders: ['Content-Range', 'Content-Length', 'ETag', 'Accept-Ranges'],
  })
);

// 2. Health & Ping endpoints
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', serverTime: new Date().toISOString() });
});

app.get('/api/ping', (c) => {
  return c.json({
    status: 'ok',
    message: 'Birthday Wish Server is awake! 🎉',
    timestamp: Date.now(),
  });
});

// 3. Phone validation endpoint
app.post('/api/validate-phone', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { phone } = body;
  const result = validateAndNormalizeIndianPhone(phone);
  return c.json(result);
});

// 4. Mount Birthday & Media API routes cleanly under /api (Option A)
app.route('/api', birthdayRoutes);
app.route('/api', mediaRoutes);

// 5. Admin Cleanup Endpoint (Manual trigger / integration testing)
app.post('/api/admin/cleanup', async (c) => {
  try {
    const stats = await runMediaCleanup(c.env);
    return c.json({ success: true, stats });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 6. Media fallback endpoint
app.get('/media/*', (c) => {
  return c.json({ error: 'Media file not found or external storage is used.' }, 404);
});

// 7. Explicit 404 for unhandled API routes (Always return JSON, never HTML)
app.all('/api/*', (c) => {
  return c.json({ error: 'API route not found' }, 404);
});

// 8. SPA and Static Asset Fallback (Cloudflare Workers Assets)
app.all('*', async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

export default {
  fetch: app.fetch,
  // Hourly Cron Trigger handler for automated 72-hour media cleanup
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runMediaCleanup(env));
  },
};
