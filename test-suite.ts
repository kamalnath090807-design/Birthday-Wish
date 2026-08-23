import { app } from './server/app.js';
import { validateAndNormalizeIndianPhone } from './server/utils/phone.js';
import { getBirthdayStatus } from './src/utils/dateUtils.js';
import { buildFormattedMessage, buildThankYouMessage } from './src/utils/share.js';
import http from 'http';

async function runTests() {
  console.log('🧪 Starting Full Test Suite (Recipient 3D Wish Experience, Thank You, Privacy & Expiration)...\n');
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

  // 3. Production Server & API Integration Tests
  console.log('\n--- 3. Production Express Server Integration Tests ---');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const SERVER_URL = `http://localhost:${address.port}`;
  const API_URL = `${SERVER_URL}/api`;

  try {
    // 1. Health check & Ping
    const healthRes = await fetch(`${API_URL}/health`);
    const health = await healthRes.json();
    assert(health.status === 'ok', 'Health Check Endpoint (/api/health)');

    const pingRes = await fetch(`${API_URL}/ping`);
    const ping = await pingRes.json();
    assert(ping.status === 'ok' && ping.message.includes('awake'), 'Ping Endpoint (/api/ping)');

    // 2. Create Active Birthday (Today)
    const todayStr = new Date().toISOString().split('T')[0];
    const createRes = await fetch(`${API_URL}/birthdays`, {
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
    });
    const created = await createRes.json();
    assert(created.publicToken && created.name === 'Kamalnath B', 'Create Birthday Event API (/api/birthdays)');

    const token = created.publicToken;

    // 3. Public Details Privacy: Hides PIN and does not expose totalWishes/stats
    const publicRes = await fetch(`${API_URL}/birthdays/${token}`);
    const publicData = await publicRes.json();
    assert(publicData.name === 'Kamalnath B' && publicData.adminPin === undefined, 'Public details hides admin PIN');
    assert(publicData.stats === undefined, 'Public details hides internal stats');

    // 4. Privacy: Wish list is unauthorized without Admin PIN
    const wishesPublicRes = await fetch(`${API_URL}/birthdays/${token}/wishes`);
    assert(wishesPublicRes.status === 401, 'Public cannot fetch wish feed without Admin PIN (401 Unauthorized)');

    // 5. Admin can fetch wish list with PIN
    const wishesAdminRes = await fetch(`${API_URL}/birthdays/${token}/wishes?pin=9988`);
    assert(wishesAdminRes.status === 200, 'Admin can fetch wish feed with PIN');

    // 6. Submit Wish on Active Birthday
    const wishRes = await fetch(`${API_URL}/birthdays/${token}/wishes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderName: 'Kamal',
        message: 'Wishing you happiness, good health, and an amazing year ahead! 🎂🎉',
        theme: 'gold',
        deliveryMethod: 'whatsapp',
      }),
    });
    const wish = await wishRes.json();
    assert(wish.id && wish.senderName === 'Kamal', 'Submit Wish on Active Birthday succeeds');

    // 7. Get Dedicated Recipient Wish Endpoint (/api/wishes/:wishId)
    const getWishRes = await fetch(`${API_URL}/wishes/${wish.id}`);
    const wishPayload = await getWishRes.json();
    assert(wishPayload.wish && wishPayload.wish.id === wish.id, 'Get Recipient 3D Wish endpoint (/api/wishes/:wishId)');
    assert(wishPayload.birthday && wishPayload.birthday.name === 'Kamalnath B', 'Recipient 3D Wish endpoint includes birthday details');

    // 8. Expired Birthday Rejection (Day 3+)
    const expiredDateStr = new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0];
    const createExpiredRes = await fetch(`${API_URL}/birthdays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Old Event',
        phone: '9876543210',
        birthdayDate: expiredDateStr,
        adminPin: '1111',
      }),
    });
    const expiredBday = await createExpiredRes.json();
    const expiredWishRes = await fetch(`${API_URL}/birthdays/${expiredBday.publicToken}/wishes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderName: 'Late Senders',
        message: 'Should be rejected',
        theme: 'gold',
      }),
    });
    assert(expiredWishRes.status === 403, 'Submitting wish after 2-day window is rejected with 403 Forbidden');

    // 9. Moderation: Delete Wish
    const delRes = await fetch(`${API_URL}/birthdays/${token}/wishes/${wish.id}`, {
      method: 'DELETE',
    });
    const del = await delRes.json();
    assert(del.success === true, 'Delete/Moderate Wish API');

  } catch (err: any) {
    console.error('API Test Error:', err);
    assert(false, `API Tests execution: ${err.message}`);
  } finally {
    server.close();
  }

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
