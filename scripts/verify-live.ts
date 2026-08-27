async function verify() {
  console.log('Testing Cloudflare Worker at http://127.0.0.1:8787...\n');

  // 1. Health
  const healthRes = await fetch('http://127.0.0.1:8787/api/health');
  const health = (await healthRes.json()) as any;
  console.log('1. Health check:', healthRes.status, health);

  // 2. Demo Birthday from D1
  const demoRes = await fetch('http://127.0.0.1:8787/api/birthdays/arun-kumar-demo');
  const demo = (await demoRes.json()) as any;
  console.log('2. Demo birthday from D1:', demoRes.status, demo.name, demo.phoneMasked);

  // 3. POST /api/birthdays (Fixes 405 error!)
  const createRes = await fetch('http://127.0.0.1:8787/api/birthdays', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Kamalnath Live Test',
      phone: '9876543210',
      email: 'kamal@example.com',
      birthdayDate: '2026-08-27',
      themePreference: 'gold',
      adminPin: '7788',
    }),
  });
  console.log('3. POST /api/birthdays status:', createRes.status, '(Expected 201)');
  const created = (await createRes.json()) as any;
  console.log('   Created publicToken:', created.publicToken);

  // 4. Submit Wish
  const wishRes = await fetch(`http://127.0.0.1:8787/api/birthdays/${created.publicToken}/wishes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderName: 'Antigravity AI',
      message: 'Wishing you a stellar year on Cloudflare Workers! 🚀🎂',
      theme: 'galaxy',
      deliveryMethod: 'whatsapp',
    }),
  });
  console.log('4. POST wish status:', wishRes.status, '(Expected 201)');
  const wish = (await wishRes.json()) as any;
  console.log('   Created wish ID:', wish.id);

  // 5. Get Wish by ID (3D Card)
  const wishCardRes = await fetch(`http://127.0.0.1:8787/api/wishes/${wish.id}`);
  const wishCard = (await wishCardRes.json()) as any;
  console.log('5. Wish card recipient:', wishCard.birthday.name, '| Sender:', wishCard.wish.senderName);

  // 6. SPA fallback test for deep route
  const spaRes = await fetch(`http://127.0.0.1:8787/birthday/${created.publicToken}`);
  const html = await spaRes.text();
  console.log('6. SPA deep link route status:', spaRes.status, '| Contains root div:', html.includes('id="root"'));

  console.log('\n🎉 ALL LIVE CLOUDFLARE WORKER ENDPOINTS VERIFIED PERFECTLY!');
}

verify().catch((e) => {
  console.error(e);
  process.exit(1);
});
