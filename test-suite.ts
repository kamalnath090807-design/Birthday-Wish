import { app } from './worker/index.js';
import { validateAndNormalizeIndianPhone } from './worker/utils/phone.js';
import { getBirthdayStatus } from './src/utils/dateUtils.js';
import { buildFormattedMessage, buildThankYouMessage } from './src/utils/share.js';
import { isValidUploadFile } from './src/utils/fileValidation.js';
import { api } from './src/services/api.js';
import { runMediaCleanup } from './worker/services/cleanup.js';
import { getCloudinaryConfig } from './worker/utils/cloudinary.js';
import { Env, TemporaryMedia } from './worker/types.js';

// --- In-Memory D1 Mock for Comprehensive Edge Integration Testing ---

class MockD1 {
  birthdays: any[] = [];
  wishes: any[] = [];
  temporaryMedia: any[] = [];

  prepare(sql: string) {
    let boundArgs: any[] = [];
    const self = this;
    const stmt = {
      bind(...args: any[]) {
        boundArgs = args;
        return stmt;
      },
      async first<T = any>() {
        const { results } = await stmt.all<T>();
        return results[0] || null;
      },
      async all<T = any>() {
        if (sql.includes('SELECT * FROM birthdays WHERE public_token = ?')) {
          const res = self.birthdays.filter((b) => b.public_token === boundArgs[0]);
          return { results: res as T[] };
        }
        if (sql.includes('SELECT * FROM birthdays WHERE id = ?')) {
          const res = self.birthdays.filter((b) => b.id === boundArgs[0]);
          return { results: res as T[] };
        }
        if (sql.includes('SELECT * FROM birthdays ORDER BY created_at DESC')) {
          const res = [...self.birthdays].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          return { results: res as T[] };
        }
        if (sql.includes('SELECT * FROM wishes WHERE birthday_token = ?')) {
          const res = self.wishes.filter((w) => w.birthday_token === boundArgs[0]);
          return { results: res as T[] };
        }
        if (sql.includes('SELECT * FROM wishes WHERE id = ?')) {
          const res = self.wishes.filter((w) => w.id === boundArgs[0]);
          return { results: res as T[] };
        }
        if (sql.includes('SELECT * FROM temporary_media')) {
          const cutoff = boundArgs[0];
          const res = self.temporaryMedia.filter(
            (m) => m.expires_at <= cutoff && m.deleted_at === null && m.cleanup_status !== 'deleted'
          );
          return { results: res as T[] };
        }
        return { results: [] as T[] };
      },
      async run() {
        if (sql.includes('INSERT INTO birthdays')) {
          const [
            id,
            public_token,
            admin_pin,
            name,
            phone,
            phone_masked,
            email,
            photo_url,
            birthday_date,
            theme_preference,
            created_at,
            total_wishes,
            whatsapp_shares,
            sms_shares,
            email_shares,
            images_received,
            videos_received,
          ] = boundArgs;

          self.birthdays.push({
            id,
            public_token,
            admin_pin,
            name,
            phone,
            phone_masked,
            email,
            photo_url,
            birthday_date,
            theme_preference,
            created_at,
            total_wishes: total_wishes || 0,
            whatsapp_shares: whatsapp_shares || 0,
            sms_shares: sms_shares || 0,
            email_shares: email_shares || 0,
            images_received: images_received || 0,
            videos_received: videos_received || 0,
          });
          return { meta: { changes: 1 } };
        }

        if (sql.includes('INSERT INTO wishes')) {
          const [
            id,
            birthday_token,
            sender_name,
            message,
            image_url,
            video_url,
            theme,
            delivery_method,
            created_at,
          ] = boundArgs;

          self.wishes.unshift({
            id,
            birthday_token,
            sender_name,
            message,
            image_url,
            video_url,
            theme,
            delivery_method,
            created_at,
          });
          return { meta: { changes: 1 } };
        }

        if (sql.includes('INSERT INTO temporary_media')) {
          const [
            id,
            provider_asset_id,
            provider_public_id,
            resource_type,
            media_url,
            birthday_token,
            wish_id,
            expires_at,
            created_at,
            cleanup_status,
          ] = boundArgs;

          self.temporaryMedia.push({
            id,
            provider_asset_id,
            provider_public_id,
            resource_type,
            media_url,
            birthday_token,
            wish_id,
            expires_at,
            created_at,
            deleted_at: null,
            cleanup_status: cleanup_status || 'pending',
            error_message: null,
          });
          return { meta: { changes: 1 } };
        }

        if (sql.includes('UPDATE temporary_media SET birthday_token = ? WHERE media_url = ?')) {
          const [token, url] = boundArgs;
          const m = self.temporaryMedia.find((x) => x.media_url === url);
          if (m) m.birthday_token = token;
          return { meta: { changes: 1 } };
        }

        if (sql.includes('UPDATE temporary_media SET wish_id = ?, birthday_token = ? WHERE media_url = ?')) {
          const [wishId, token, url] = boundArgs;
          const m = self.temporaryMedia.find((x) => x.media_url === url);
          if (m) {
            m.wish_id = wishId;
            m.birthday_token = token;
          }
          return { meta: { changes: 1 } };
        }

        if (sql.includes('UPDATE temporary_media') && sql.includes("cleanup_status = 'deleted'")) {
          const [deletedAt, id] = boundArgs;
          const m = self.temporaryMedia.find((x) => x.id === id);
          if (m) {
            m.deleted_at = deletedAt;
            m.cleanup_status = 'deleted';
            m.error_message = null;
          }
          return { meta: { changes: 1 } };
        }

        if (sql.includes('UPDATE temporary_media') && sql.includes("cleanup_status = 'failed'")) {
          const [error, id] = boundArgs;
          const m = self.temporaryMedia.find((x) => x.id === id);
          if (m) {
            m.cleanup_status = 'failed';
            m.error_message = error;
          }
          return { meta: { changes: 1 } };
        }

        if (sql.includes('UPDATE birthdays SET photo_url = NULL WHERE photo_url = ?')) {
          const [url] = boundArgs;
          self.birthdays.forEach((b) => {
            if (b.photo_url === url) b.photo_url = null;
          });
          return { meta: { changes: 1 } };
        }

        if (sql.includes('UPDATE wishes SET image_url = NULL WHERE image_url = ?')) {
          const [url] = boundArgs;
          self.wishes.forEach((w) => {
            if (w.image_url === url) w.image_url = null;
          });
          return { meta: { changes: 1 } };
        }

        if (sql.includes('UPDATE wishes SET video_url = NULL WHERE video_url = ?')) {
          const [url] = boundArgs;
          self.wishes.forEach((w) => {
            if (w.video_url === url) w.video_url = null;
          });
          return { meta: { changes: 1 } };
        }

        if (sql.includes('UPDATE birthdays SET')) {
          if (sql.includes('total_wishes = total_wishes + 1')) {
            const [isImg, isVid, isWa, isSms, isEm, token] = boundArgs;
            const b = self.birthdays.find((x) => x.public_token === token);
            if (b) {
              b.total_wishes = (b.total_wishes || 0) + 1;
              b.images_received = (b.images_received || 0) + isImg;
              b.videos_received = (b.videos_received || 0) + isVid;
              b.whatsapp_shares = (b.whatsapp_shares || 0) + isWa;
              b.sms_shares = (b.sms_shares || 0) + isSms;
              b.email_shares = (b.email_shares || 0) + isEm;
            }
          } else if (sql.includes('total_wishes = MAX(0, total_wishes - 1)')) {
            const [token] = boundArgs;
            const b = self.birthdays.find((x) => x.public_token === token);
            if (b && b.total_wishes > 0) b.total_wishes -= 1;
          } else if (sql.includes('whatsapp_shares = whatsapp_shares + 1')) {
            const [token] = boundArgs;
            const b = self.birthdays.find((x) => x.public_token === token);
            if (b) b.whatsapp_shares = (b.whatsapp_shares || 0) + 1;
          }
          return { meta: { changes: 1 } };
        }

        if (sql.includes('DELETE FROM wishes WHERE id = ? AND birthday_token = ?')) {
          const [wishId, token] = boundArgs;
          const idx = self.wishes.findIndex(
            (w) => w.id === wishId && w.birthday_token === token
          );
          if (idx !== -1) {
            self.wishes.splice(idx, 1);
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        }

        return { meta: { changes: 0 } };
      },
    };
    return stmt;
  }

  async batch(statements: any[]) {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }
}

// Global fetch interceptor to mock Cloudinary API during testing
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  if (url.includes('api.cloudinary.com')) {
    if (url.includes('/image/upload')) {
      return new Response(
        JSON.stringify({
          secure_url: 'https://res.cloudinary.com/demo/image/upload/v1700000000/birthday_wish/photo-1.jpg',
          public_id: 'birthday_wish/photo-1',
          asset_id: 'asset-image-12345',
          resource_type: 'image',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.includes('/video/upload')) {
      return new Response(
        JSON.stringify({
          secure_url: 'https://res.cloudinary.com/demo/video/upload/v1700000000/birthday_wish/video-1.mp4',
          public_id: 'birthday_wish/video-1',
          asset_id: 'asset-video-67890',
          resource_type: 'video',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.includes('/destroy')) {
      return new Response(
        JSON.stringify({
          result: 'ok',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return originalFetch(input, init);
};

async function runTests() {
  console.log('🧪 Starting Full Cloudflare Worker Test Suite (D1, 72h Temporary Storage, Privacy & Expiration)...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Phone Normalization Unit Tests
  console.log('--- 1. Phone Normalization & Validation ---');
  const valid1 = validateAndNormalizeIndianPhone('9876543210');
  assert(valid1.isValid && valid1.normalized === '+919876543210', 'Plain 10 digit Indian number');

  const valid2 = validateAndNormalizeIndianPhone('+919876543210');
  assert(valid2.isValid && valid2.normalized === '+919876543210', 'Number with +91 prefix');

  const invalid1 = validateAndNormalizeIndianPhone('1234567890');
  assert(!invalid1.isValid, 'Invalid leading digit');

  // 2. Dynamic 2-Day Birthday Logic (Today vs Belated vs Expired)
  console.log('\n--- 2. Dynamic 2-Day Birthday Logic & Expiration Tests ---');
  const refDate = new Date(2026, 7, 23); // Aug 23, 2026

  // Scenario A: Birthday is TODAY (Aug 23) -> Active Day 1
  const statusToday = getBirthdayStatus('2026-08-23', undefined, refDate);
  assert(statusToday.isToday === true, 'Status on Birthday Date is isToday=true');
  assert(statusToday.isBelated === false, 'Status on Birthday Date is isBelated=false');
  assert(statusToday.isExpired === false, 'Status on Birthday Date is isExpired=false');
  assert(statusToday.greetingTitle === 'Happy Birthday', 'Greeting title on Birthday is "Happy Birthday"');
  assert(statusToday.sharePrefix === 'HAPPY BIRTHDAY', 'Share prefix is "HAPPY BIRTHDAY"');

  // Scenario B: Birthday was YESTERDAY (Aug 22) -> Active Day 2 (Belated!)
  const statusBelated = getBirthdayStatus('2026-08-22', undefined, refDate);
  assert(statusBelated.isToday === false, 'Status on Next Day is isToday=false');
  assert(statusBelated.isYesterday === true, 'Status on Next Day is isYesterday=true');
  assert(statusBelated.isBelated === true, 'Status on Next Day is isBelated=true');
  assert(statusBelated.isExpired === false, 'Status on Next Day (Day 2) is NOT expired');
  assert(statusBelated.greetingTitle === 'Belated Happy Birthday', 'Greeting title on Next Day is "Belated Happy Birthday"');
  assert(statusBelated.sharePrefix === 'BELATED HAPPY BIRTHDAY', 'Share prefix on Next Day is "BELATED HAPPY BIRTHDAY"');

  // Scenario C: Birthday was 3 DAYS AGO (Aug 20) -> EXPIRED (Day 3+)
  const statusExpired = getBirthdayStatus('2026-08-20', undefined, refDate);
  assert(statusExpired.isExpired === true, 'Status after 2 days is isExpired=true (Wishes Closed)');
  assert(statusExpired.greetingTitle === 'Celebration Concluded', 'Greeting title is "Celebration Concluded"');

  // Scenario D: Birthday is UPCOMING (Aug 25)
  const statusUpcoming = getBirthdayStatus('2026-08-25', undefined, refDate);
  assert(statusUpcoming.isUpcoming === true, 'Status 2 days before is isUpcoming=true');
  assert(statusUpcoming.isExpired === false, 'Upcoming birthday is not expired');
  assert(statusUpcoming.daysDiff === 2, 'Countdown shows 2 days remaining');

  // Scenario E: Share Message Builder Tests (Rich WhatsApp markdown & 3D link)
  const msgToday = buildFormattedMessage({
    recipientName: 'Kamalnath B',
    recipientPhone: '+919876543210',
    senderName: 'Kamal',
    message: 'Wishing you a great year ahead!',
    cardUrl: 'https://bday.com/wish/wish-12345',
    isBelated: false,
  });
  assert(msgToday.includes('*🎂 HAPPY BIRTHDAY KAMALNATH B! 🎂*'), 'Share message contains bold WhatsApp header');
  assert(msgToday.includes('https://bday.com/wish/wish-12345'), 'Share message contains direct 3D wish card link');
  assert(msgToday.includes('🎂') && msgToday.includes('🎁'), 'Share message includes celebratory emojis');

  // Scenario F: Thank You Message Builder
  const thankYouMsg = buildThankYouMessage('Kamalnath B', 'Kamal');
  assert(thankYouMsg.includes('*💖 THANK YOU SO MUCH, KAMAL! 💖*'), 'Thank you message contains bold recipient thank you header');
  assert(thankYouMsg.includes('Kamalnath B'), 'Thank you message signed by birthday recipient');

  // 3. File Validation Utility Tests
  console.log('\n--- 3. File Validation Utility Tests ---');
  assert(!isValidUploadFile(null), 'isValidUploadFile rejects null');
  assert(!isValidUploadFile(undefined), 'isValidUploadFile rejects undefined');
  assert(!isValidUploadFile(''), 'isValidUploadFile rejects string');
  assert(!isValidUploadFile({}), 'isValidUploadFile rejects plain empty object');
  assert(!isValidUploadFile({ name: '', size: 100 }), 'isValidUploadFile rejects empty filename');
  assert(!isValidUploadFile({ name: 'pic.jpg', size: 0 }), 'isValidUploadFile rejects 0-byte file');
  assert(isValidUploadFile(new File(['hello'], 'greeting.txt', { type: 'text/plain' })), 'isValidUploadFile accepts genuine File object');

  // 4. Cloudflare Worker Edge & API Integration Tests
  console.log('\n--- 4. Cloudflare Worker API & D1 Database Integration Tests ---');

  const mockDb = new MockD1();
  const env: Env = {
    DB: mockDb as unknown as D1Database,
    CLOUDINARY_CLOUD_NAME: 'demo-cloud',
    CLOUDINARY_API_KEY: 'mock-key-123',
    CLOUDINARY_API_SECRET: 'mock-secret-456',
  };

  const API_BASE = 'https://birthday-wish.workers.dev/api';

  try {
    // 1. Health check & Ping
    const healthRes = await app.fetch(new Request(`${API_BASE}/health`), env);
    const health = (await healthRes.json()) as any;
    assert(health.status === 'ok', 'Health Check Endpoint (/api/health)');

    const pingRes = await app.fetch(new Request(`${API_BASE}/ping`), env);
    const ping = (await pingRes.json()) as any;
    assert(ping.status === 'ok' && ping.message.includes('awake'), 'Ping Endpoint (/api/ping)');

    // 2. Validate Phone Endpoint
    const valPhoneRes = await app.fetch(
      new Request(`${API_BASE}/validate-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '9876543210' }),
      }),
      env
    );
    const valPhone = (await valPhoneRes.json()) as any;
    assert(valPhone.isValid && valPhone.normalized === '+919876543210', 'Validate Phone Endpoint (/api/validate-phone)');

    // 3. Create Active Birthday (POST /api/birthdays -> MUST return 201 Created and NOT 405)
    const todayStr = new Date().toISOString().split('T')[0];
    const createRes = await app.fetch(
      new Request(`${API_BASE}/birthdays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Kamalnath B',
          phone: '9876543210',
          email: 'kamal@example.com',
          birthdayDate: todayStr,
          themePreference: 'gold',
          adminPin: '9988',
        }),
      }),
      env
    );
    assert(createRes.status === 201, 'POST /api/birthdays returns 201 Created (No HTTP 405 error)');
    const created = (await createRes.json()) as any;
    assert(created.publicToken && created.name === 'Kamalnath B', 'Created Birthday Event persists with valid publicToken');

    const token = created.publicToken;

    // 4. Public Details Privacy: Hides PIN and internal stats
    const publicRes = await app.fetch(new Request(`${API_BASE}/birthdays/${token}`), env);
    const publicData = (await publicRes.json()) as any;
    assert(publicData.name === 'Kamalnath B' && publicData.adminPin === undefined, 'Public details hides admin PIN');
    assert(publicData.stats === undefined, 'Public details hides internal stats');

    // 5. Privacy: Wish list is unauthorized without Admin PIN
    const wishesPublicRes = await app.fetch(new Request(`${API_BASE}/birthdays/${token}/wishes`), env);
    assert(wishesPublicRes.status === 401, 'Public cannot fetch private wishes without Admin PIN (401 Unauthorized)');

    // 6. Admin can fetch wish list with PIN
    const wishesAdminRes = await app.fetch(new Request(`${API_BASE}/birthdays/${token}/wishes?pin=9988`), env);
    assert(wishesAdminRes.status === 200, 'Admin can fetch wish feed with correct PIN');

    // 7. Submit Wish on Active Birthday (POST /api/birthdays/:token/wishes)
    const wishRes = await app.fetch(
      new Request(`${API_BASE}/birthdays/${token}/wishes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: 'Kamal',
          message: 'Wishing you happiness, good health, and an amazing year ahead! 🎂🎉',
          theme: 'gold',
          deliveryMethod: 'whatsapp',
        }),
      }),
      env
    );
    assert(wishRes.status === 201, 'Submit Wish on Active Birthday returns 201 Created');
    const wish = (await wishRes.json()) as any;
    assert(wish.id && wish.senderName === 'Kamal', 'Wish persists in database');

    // 8. Get Dedicated Recipient Wish Endpoint (/api/wishes/:wishId)
    const getWishRes = await app.fetch(new Request(`${API_BASE}/wishes/${wish.id}`), env);
    const wishPayload = (await getWishRes.json()) as any;
    assert(wishPayload.wish && wishPayload.wish.id === wish.id, 'Get Recipient 3D Wish endpoint (/api/wishes/:wishId)');
    assert(wishPayload.birthday && wishPayload.birthday.name === 'Kamalnath B', 'Recipient 3D Wish endpoint includes birthday details');

    // 9. Expired Birthday Rejection (Day 3+)
    const expiredDateStr = new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0];
    const createExpiredRes = await app.fetch(
      new Request(`${API_BASE}/birthdays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Old Event',
          phone: '9876543210',
          birthdayDate: expiredDateStr,
          adminPin: '1111',
        }),
      }),
      env
    );
    const expiredBday = (await createExpiredRes.json()) as any;
    const expiredWishRes = await app.fetch(
      new Request(`${API_BASE}/birthdays/${expiredBday.publicToken}/wishes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: 'Late Senders',
          message: 'Should be rejected',
          theme: 'gold',
        }),
      }),
      env
    );
    assert(expiredWishRes.status === 403, 'Submitting wish after 2-day window is rejected with 403 Forbidden');

    // 10. Track Delivery Share
    const shareRes = await app.fetch(
      new Request(`${API_BASE}/birthdays/${token}/track-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'whatsapp' }),
      }),
      env
    );
    const shareData = (await shareRes.json()) as any;
    assert(shareData.success === true, 'Track Delivery Share API (/api/birthdays/:token/track-share)');

    // 11. Moderation: Delete Wish
    const delRes = await app.fetch(
      new Request(`${API_BASE}/birthdays/${token}/wishes/${wish.id}`, {
        method: 'DELETE',
      }),
      env
    );
    const del = (await delRes.json()) as any;
    assert(del.success === true, 'Delete/Moderate Wish API (/api/birthdays/:token/wishes/:wishId)');

    // 12. Strict Upload Contract & 72-Hour Temporary Media Tests
    console.log('\n--- 5. 72-Hour Temporary Media Upload & Automated Cleanup Tests ---');

    // A. Client guard: null/undefined/empty file throws client-side without calling API
    let clientGuardPassed = false;
    try {
      await api.uploadMedia(null);
    } catch (e: any) {
      if (e.message.includes('No valid file selected')) {
        clientGuardPassed = true;
      }
    }
    assert(clientGuardPassed, 'api.uploadMedia rejects null input client-side without network request');

    // B. Text-only Birthday Creation (0 upload calls, photoUrl is undefined)
    const textOnlyCreateRes = await app.fetch(
      new Request(`${API_BASE}/birthdays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Text Only Celebrant',
          phone: '9123456780',
          adminPin: '4321',
        }),
      }),
      env
    );
    assert(textOnlyCreateRes.status === 201, 'Text-only birthday creation succeeds with 201 Created');
    const textOnlyBday = (await textOnlyCreateRes.json()) as any;
    assert(!textOnlyBday.photoUrl, 'Text-only birthday has no photoUrl and made 0 upload calls');

    // C. Text-only Wish Submission (0 upload calls, imageUrl/videoUrl are undefined)
    const textOnlyWishRes = await app.fetch(
      new Request(`${API_BASE}/birthdays/${textOnlyBday.publicToken}/wishes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: 'Text Friend',
          message: 'Happy Birthday without photos! 🎉',
          theme: 'pastel',
        }),
      }),
      env
    );
    assert(textOnlyWishRes.status === 201, 'Text-only wish submission succeeds with 201 Created');
    const textOnlyWish = (await textOnlyWishRes.json()) as any;
    assert(!textOnlyWish.imageUrl && !textOnlyWish.videoUrl, 'Text-only wish has no media URLs');

    // D. Explicit Route Verification: POST /api/upload reaches upload handler directly
    const routeVerifyForm = new FormData();
    routeVerifyForm.append('file', new File(['route-test-bytes'], 'route-test.jpg', { type: 'image/jpeg' }));
    const routeVerifyRes = await app.fetch(
      new Request(`${API_BASE}/upload`, {
        method: 'POST',
        body: routeVerifyForm,
      }),
      env
    );
    assert(routeVerifyRes.status === 200, 'Route POST /api/upload maps directly to upload handler (200 OK)');

    // E. Real Photo Upload with Cloudinary -> Returns 200 with 72-Hour Expiration & Signed Payload
    const imgFormData = new FormData();
    const mockImage = new File(['mock-image-content-bytes'], 'birthday-photo.jpg', { type: 'image/jpeg' });
    imgFormData.append('file', mockImage);

    const uploadImgRes = await app.fetch(
      new Request(`${API_BASE}/upload`, {
        method: 'POST',
        body: imgFormData,
      }),
      env
    );
    assert(uploadImgRes.status === 200, 'Uploading image with configured storage returns 200 OK');
    const uploadImgData = (await uploadImgRes.json()) as any;
    assert(uploadImgData.url.includes('cloudinary.com'), 'Upload response includes public Cloudinary URL');
    assert(uploadImgData.publicId === 'birthday_wish/photo-1', 'Upload response contains Cloudinary publicId');
    assert(uploadImgData.type === 'image', 'Upload response contains image type');
    assert(typeof uploadImgData.expiresAt === 'string', 'Upload response includes ISO expiresAt timestamp');

    // Verify 72-hour expiry timestamp calculation
    const expiryDiffHours = (new Date(uploadImgData.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
    assert(Math.round(expiryDiffHours) === 72, 'ExpiresAt is set to approximately 72 hours (3 days)');

    // F. Verify record in temporary_media D1 table
    const tempMediaRecord = mockDb.temporaryMedia.find((m) => m.media_url === uploadImgData.url);
    assert(!!tempMediaRecord, 'D1 temporary_media table contains tracking record');
    assert(tempMediaRecord.cleanup_status === 'pending', 'Initial cleanup_status is pending');

    // G. Link photo to a birthday
    const bdayWithPhotoRes = await app.fetch(
      new Request(`${API_BASE}/birthdays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Photo Celebrant',
          phone: '9888877777',
          photoUrl: uploadImgData.url,
          adminPin: '5566',
        }),
      }),
      env
    );
    assert(bdayWithPhotoRes.status === 201, 'Birthday created with temporary photo URL');
    const bdayWithPhoto = (await bdayWithPhotoRes.json()) as any;
    assert(bdayWithPhoto.photoUrl === uploadImgData.url, 'Birthday stores photo URL');

    // H. Real Video Upload with Cloudinary -> Returns 200 with 72-Hour Expiration
    const vidFormData = new FormData();
    const mockVideo = new File(['mock-video-content-bytes'], 'greeting-video.mp4', { type: 'video/mp4' });
    vidFormData.append('file', mockVideo);

    const uploadVidRes = await app.fetch(
      new Request(`${API_BASE}/upload`, {
        method: 'POST',
        body: vidFormData,
      }),
      env
    );
    assert(uploadVidRes.status === 200, 'Uploading video returns 200 OK');
    const uploadVidData = (await uploadVidRes.json()) as any;
    assert(uploadVidData.type === 'video', 'Video resourceType is video');

    // Link video to wish
    const wishWithVideoRes = await app.fetch(
      new Request(`${API_BASE}/birthdays/${bdayWithPhoto.publicToken}/wishes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: 'Video Sender',
          message: 'Watch this clip!',
          videoUrl: uploadVidData.url,
          theme: 'cyber',
        }),
      }),
      env
    );
    assert(wishWithVideoRes.status === 201, 'Wish created with temporary video URL');

    // I. Missing Cloudinary credentials returns explicit server configuration error (NOT fake generic message)
    const unconfiguredEnv: Env = {
      DB: mockDb as unknown as D1Database,
    };
    const unconfFormData = new FormData();
    unconfFormData.append('file', new File(['file-bytes'], 'test.jpg', { type: 'image/jpeg' }));
    const unconfRes = await app.fetch(
      new Request(`${API_BASE}/upload`, {
        method: 'POST',
        body: unconfFormData,
      }),
      unconfiguredEnv
    );
    assert(unconfRes.status === 503, 'Unconfigured Cloudinary secrets return HTTP 503');
    const unconfData = (await unconfRes.json()) as any;
    assert(unconfData.error === 'Media storage is not configured on the server.', 'Unconfigured error explicitly explains missing server media storage');

    // J. Helper getCloudinaryConfig validation tests
    let configHelperThrows = false;
    try {
      getCloudinaryConfig(unconfiguredEnv);
    } catch (e: any) {
      if (e.message.includes('Media storage is not configured on the server')) {
        configHelperThrows = true;
      }
    }
    assert(configHelperThrows, 'getCloudinaryConfig helper validates missing credentials and throws controlled error');

    // K. Automated Cleanup Job: Non-expired items are NOT deleted
    const earlyCleanup = await runMediaCleanup(env);
    assert(earlyCleanup.totalFound === 0, 'Cleanup does not delete non-expired active media (< 72h)');
    assert(earlyCleanup.deleted === 0, 'Zero active media deleted early');

    // L. Automated Cleanup Job: Expired items (>= 72h) are deleted and references nullified
    // Simulate 72 hours passing by setting expires_at to the past
    mockDb.temporaryMedia.forEach((m) => {
      m.expires_at = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // Expired 1 hour ago
    });

    const expiredCleanup = await runMediaCleanup(env);
    assert(expiredCleanup.totalFound >= 2, 'Cleanup identifies expired media assets (>= 72h)');
    assert(expiredCleanup.deleted >= 2, 'Cleanup successfully deletes expired Cloudinary assets');

    // M. Verify D1 status updated to 'deleted'
    const cleanedImg = mockDb.temporaryMedia.find((m) => m.media_url === uploadImgData.url);
    assert(cleanedImg.cleanup_status === 'deleted', 'temporary_media record marked cleanup_status=deleted');
    assert(cleanedImg.deleted_at !== null, 'temporary_media record has deleted_at timestamp');

    // N. Verify D1 media references are nullified
    const updatedBday = mockDb.birthdays.find((b) => b.public_token === bdayWithPhoto.publicToken);
    assert(updatedBday.photo_url === null, 'Birthday photo_url is nullified in D1 after 72h expiration');

    const updatedWish = mockDb.wishes.find((w) => w.video_url === uploadVidData.url || (w.sender_name === 'Video Sender' && w.video_url === null));
    assert(updatedWish.video_url === null, 'Wish video_url is nullified in D1 after 72h expiration');

    // O. Cleanup Idempotence: Running cleanup again does nothing and does not fail
    const secondCleanup = await runMediaCleanup(env);
    assert(secondCleanup.totalFound === 0, 'Subsequent cleanup runs are idempotent (0 remaining to delete)');
    assert(secondCleanup.deleted === 0, 'No duplicate deletions attempted');
  } catch (err: any) {
    console.error('API Test Error:', err);
    assert(false, `API Tests execution: ${err.message}`);
  }

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
