import { app } from './worker/index.js';
import { validateAndNormalizeIndianPhone } from './worker/utils/phone.js';
import { getBirthdayStatus } from './src/utils/dateUtils.js';
import { buildFormattedMessage, buildThankYouMessage } from './src/utils/share.js';
import { Env } from './worker/types.js';

// --- In-Memory D1 and R2 Mock for Comprehensive Edge Integration Testing ---

class MockD1 {
  birthdays: any[] = [];
  wishes: any[] = [];

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

class MockR2 {
  storage = new Map<string, { body: Uint8Array; type: string }>();

  async put(key: string, value: any, options: any) {
    let bytes: Uint8Array;
    if (value && typeof value.getReader === 'function') {
      const reader = value.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        chunks.push(chunk);
      }
      const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
      bytes = new Uint8Array(totalLen);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
    } else {
      bytes = new Uint8Array(value || 0);
    }
    const type = options?.httpMetadata?.contentType || 'application/octet-stream';
    this.storage.set(key, { body: bytes, type });
    return { key };
  }

  async get(key: string) {
    const item = this.storage.get(key);
    if (!item) return null;
    return {
      body: item.body,
      size: item.body.length,
      httpEtag: '"mock-r2-etag"',
      httpMetadata: { contentType: item.type },
      writeHttpMetadata(headers: Headers) {
        headers.set('Content-Type', item.type);
      },
    };
  }
}

async function runTests() {
  console.log('🧪 Starting Full Cloudflare Worker Test Suite (D1, R2, Privacy, 405 Fix & Expiration)...\n');
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

  // 3. Cloudflare Worker Edge & API Integration Tests
  console.log('\n--- 3. Cloudflare Worker API & D1/R2 Integration Tests ---');

  const mockDb = new MockD1() as unknown as D1Database;
  const mockMedia = new MockR2() as unknown as R2Bucket;
  const env: Env = {
    DB: mockDb,
    MEDIA: mockMedia,
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

    // 12. Media Upload & Streaming (R2)
    const formData = new FormData();
    const mockFile = new File(['mock-image-content-bytes'], 'photo.jpg', { type: 'image/jpeg' });
    formData.append('file', mockFile);

    const uploadRes = await app.fetch(
      new Request(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      }),
      env
    );
    assert(uploadRes.status === 200, 'Upload image to R2 returns 200');
    const uploadData = (await uploadRes.json()) as any;
    assert(uploadData.url && uploadData.type === 'image', 'Upload response includes /media/* public URL');

    const mediaRes = await app.fetch(new Request(`https://birthday-wish.workers.dev${uploadData.url}`), env);
    assert(mediaRes.status === 200, 'Stream media from R2 returns 200 with media content');
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
