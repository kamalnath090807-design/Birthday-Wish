import { app } from './server/app.js';
import { validateAndNormalizeIndianPhone } from './server/utils/phone.js';
import http from 'http';

async function runTests() {
  console.log('🧪 Starting Full Test Suite (Render Single-Service Production Verification)...\n');
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

  const valid3 = validateAndNormalizeIndianPhone('09876543210');
  assert(valid3.isValid && valid3.normalized === '+919876543210', 'Number with leading 0');

  const valid4 = validateAndNormalizeIndianPhone('91 98765 43210');
  assert(valid4.isValid && valid4.normalized === '+919876543210', 'Number with spaces');

  const valid5 = validateAndNormalizeIndianPhone('98765-43210');
  assert(valid5.isValid && valid5.normalized === '+919876543210', 'Number with hyphen');

  const invalid1 = validateAndNormalizeIndianPhone('1234567890');
  assert(!invalid1.isValid, 'Invalid leading digit (starts with 1)');

  const invalid2 = validateAndNormalizeIndianPhone('98765');
  assert(!invalid2.isValid, 'Invalid short length');

  const invalid3 = validateAndNormalizeIndianPhone('');
  assert(!invalid3.isValid, 'Empty string');

  // 2. Production Server & API Integration Tests
  console.log('\n--- 2. Production Express Server Integration Tests ---');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const SERVER_URL = `http://localhost:${address.port}`;
  const API_URL = `${SERVER_URL}/api`;

  try {
    // 1. Health check at /api/health
    const healthRes = await fetch(`${API_URL}/health`);
    const health = await healthRes.json();
    assert(health.status === 'ok', 'Health Check Endpoint (/api/health)');

    // 2. Static Frontend Serving (Root /)
    const frontendRes = await fetch(`${SERVER_URL}/`);
    const frontendHtml = await frontendRes.text();
    assert(frontendHtml.includes('<div id="root">') || frontendHtml.includes('<!DOCTYPE html>'), 'Express serves built Vite frontend (dist/index.html)');

    // 3. SPA Route Fallback (/b/test-token)
    const spaRouteRes = await fetch(`${SERVER_URL}/b/demo-bday-1`);
    const spaHtml = await spaRouteRes.text();
    assert(spaHtml.includes('<!DOCTYPE html>'), 'SPA route fallback for React Router (/b/demo-bday-1)');

    // 4. Phone Validation Endpoint
    const phoneRes = await fetch(`${API_URL}/validate-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9876543210' }),
    });
    const phoneData = await phoneRes.json();
    assert(phoneData.isValid && phoneData.normalized === '+919876543210', 'Phone validation API (/api/validate-phone)');

    // 5. Create Birthday
    const createRes = await fetch(`${API_URL}/birthdays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sneha Patel',
        phone: '9876543210',
        email: 'sneha@example.com',
        birthdayDate: '2026-08-20',
        themePreference: 'pastel',
        adminPin: '9988',
      }),
    });
    const created = await createRes.json();
    assert(created.publicToken && created.name === 'Sneha Patel', 'Create Birthday Event API (/api/birthdays)');
    assert(created.phone === '+919876543210', 'Phone normalized in storage');

    const token = created.publicToken;

    // 6. Get Public Details (sanitized)
    const publicRes = await fetch(`${API_URL}/birthdays/${token}`);
    const publicData = await publicRes.json();
    assert(publicData.name === 'Sneha Patel' && publicData.adminPin === undefined, 'Public details hides admin PIN');

    // 7. Get Admin Details with PIN
    const adminRes = await fetch(`${API_URL}/birthdays/${token}/admin?pin=9988`);
    const adminData = await adminRes.json();
    assert(adminData.adminPin === '9988' && Array.isArray(adminData.wishes), 'Admin details with correct PIN');

    // 8. Submit Wish
    const wishRes = await fetch(`${API_URL}/birthdays/${token}/wishes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderName: 'Ankit',
        message: 'Wishing you a very Happy Birthday Sneha! Have an awesome day! 🎉',
        theme: 'pastel',
        deliveryMethod: 'whatsapp',
      }),
    });
    const wish = await wishRes.json();
    assert(wish.id && wish.senderName === 'Ankit', 'Submit Wish API (/api/birthdays/:token/wishes)');

    // 9. Track Share
    const shareRes = await fetch(`${API_URL}/birthdays/${token}/track-share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'whatsapp' }),
    });
    const share = await shareRes.json();
    assert(share.success === true, 'Track Share API');

    // 10. Verify Stats Updated
    const updatedAdminRes = await fetch(`${API_URL}/birthdays/${token}/admin?pin=9988`);
    const updatedAdmin = await updatedAdminRes.json();
    assert(updatedAdmin.stats.totalWishes >= 1, 'Total Wishes incremented');
    assert(updatedAdmin.stats.whatsappShares >= 1, 'WhatsApp Shares tracked');

    // 11. Test Media Upload (Memory / Base64 Data URL)
    const testBlob = new Blob(['fake image content for test'], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', testBlob, 'test-photo.jpg');

    const uploadRes = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    const uploadData = await uploadRes.json();
    assert(uploadData.url && uploadData.type === 'image', 'Production Media Upload endpoint (/api/upload)');

    // 12. Moderation: Delete Wish
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
