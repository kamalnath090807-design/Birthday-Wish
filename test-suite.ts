import { app } from './server/app.js';
import { validateAndNormalizeIndianPhone } from './server/utils/phone.js';
import http from 'http';

async function runTests() {
  console.log('🧪 Starting Full Test Suite (Serverless & API Verification)...\n');
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

  // 2. Integration API Tests with Test Server
  console.log('\n--- 2. Backend API Serverless & Route Tests ---');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const BASE_URL = `http://localhost:${address.port}/api`;

  try {
    // Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    assert(health.status === 'ok', 'Server Health Check');

    // Create Birthday
    const createRes = await fetch(`${BASE_URL}/birthdays`, {
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
    assert(created.publicToken && created.name === 'Sneha Patel', 'Create Birthday Event API');
    assert(created.phone === '+919876543210', 'Phone normalized in storage');

    const token = created.publicToken;

    // Get Public Details (sanitized)
    const publicRes = await fetch(`${BASE_URL}/birthdays/${token}`);
    const publicData = await publicRes.json();
    assert(publicData.name === 'Sneha Patel' && publicData.adminPin === undefined, 'Public details hides admin PIN');

    // Get Admin Details with PIN
    const adminRes = await fetch(`${BASE_URL}/birthdays/${token}/admin?pin=9988`);
    const adminData = await adminRes.json();
    assert(adminData.adminPin === '9988' && Array.isArray(adminData.wishes), 'Admin details with correct PIN');

    // Submit Wish
    const wishRes = await fetch(`${BASE_URL}/birthdays/${token}/wishes`, {
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
    assert(wish.id && wish.senderName === 'Ankit', 'Submit Wish API');

    // Track Share
    const shareRes = await fetch(`${BASE_URL}/birthdays/${token}/track-share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'whatsapp' }),
    });
    const share = await shareRes.json();
    assert(share.success === true, 'Track Share API');

    // Verify Stats Updated
    const updatedAdminRes = await fetch(`${BASE_URL}/birthdays/${token}/admin?pin=9988`);
    const updatedAdmin = await updatedAdminRes.json();
    assert(updatedAdmin.stats.totalWishes >= 1, 'Total Wishes incremented');
    assert(updatedAdmin.stats.whatsappShares >= 1, 'WhatsApp Shares tracked');

    // Test Media Upload (Memory / Base64 Data URL)
    const testBlob = new Blob(['fake image content'], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', testBlob, 'test-photo.jpg');

    const uploadRes = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    const uploadData = await uploadRes.json();
    assert(uploadData.url && uploadData.type === 'image', 'Serverless Media Upload endpoint');

    // Moderation: Delete Wish
    const delRes = await fetch(`${BASE_URL}/birthdays/${token}/wishes/${wish.id}`, {
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
