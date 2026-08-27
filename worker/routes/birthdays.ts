import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { Env, BirthdayEvent, Wish } from '../types.js';
import { d1 } from '../db/index.js';
import { validateAndNormalizeIndianPhone } from '../utils/phone.js';
import { createSlug } from '../utils/slug.js';

export const birthdayRoutes = new Hono<{ Bindings: Env }>();

// 1. Create Birthday Event
birthdayRoutes.post('/birthdays', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { name, phone, email, photoUrl, birthdayDate, themePreference, adminPin } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({ error: "Birthday person's name is required" }, 400);
    }

    const phoneValidation = validateAndNormalizeIndianPhone(phone);
    if (!phoneValidation.isValid) {
      return c.json({ error: phoneValidation.error || 'Invalid Indian phone number' }, 400);
    }

    let validEmail = '';
    if (email && typeof email === 'string' && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return c.json({ error: 'Invalid email address format' }, 400);
      }
      validEmail = email.trim().toLowerCase();
    }

    const publicToken = createSlug(name);
    const pin = (adminPin && String(adminPin).trim()) || Math.floor(1000 + Math.random() * 9000).toString();

    const newBirthday: BirthdayEvent = {
      id: nanoid(10),
      publicToken,
      adminPin: pin,
      name: name.trim(),
      phone: phoneValidation.normalized,
      phoneMasked: phoneValidation.maskedDisplay,
      email: validEmail,
      photoUrl: photoUrl || undefined,
      birthdayDate: birthdayDate || undefined,
      themePreference: themePreference || 'gold',
      createdAt: new Date().toISOString(),
      stats: {
        totalWishes: 0,
        whatsappShares: 0,
        smsShares: 0,
        emailShares: 0,
        imagesReceived: 0,
        videosReceived: 0,
      },
    };

    const saved = await d1.createBirthday(c.env.DB, newBirthday);
    return c.json(saved, 201);
  } catch (err: any) {
    console.error('Create birthday error:', err);
    return c.json({ error: err.message || 'Failed to create birthday page' }, 500);
  }
});

// 2. Sync / Restore Cached Birthday (Self-healing)
birthdayRoutes.post('/birthdays/sync', async (c) => {
  try {
    const { birthday } = await c.req.json().catch(() => ({}));
    if (birthday && birthday.publicToken && birthday.name) {
      const existing = await d1.getBirthdayByToken(c.env.DB, birthday.publicToken);
      if (!existing) {
        await d1.createBirthday(c.env.DB, birthday);
      }
    }
    return c.json({ synced: true });
  } catch (err) {
    return c.json({ synced: false });
  }
});

// 3. List All Birthdays (for admin directory / switcher)
birthdayRoutes.get('/birthdays', async (c) => {
  try {
    const list = await d1.getAllBirthdays(c.env.DB);
    const sanitized = list.map((b) => ({
      id: b.id,
      publicToken: b.publicToken,
      name: b.name,
      photoUrl: b.photoUrl,
      birthdayDate: b.birthdayDate,
      createdAt: b.createdAt,
      stats: b.stats,
    }));
    return c.json(sanitized);
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch birthdays' }, 500);
  }
});

// 4. Get Public Birthday Details (Sanitized, no PIN / private stats)
birthdayRoutes.get('/birthdays/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const birthday = await d1.getBirthdayByToken(c.env.DB, token);

    if (!birthday) {
      return c.json({ error: 'Birthday event not found' }, 404);
    }

    return c.json({
      publicToken: birthday.publicToken,
      name: birthday.name,
      phone: birthday.phone,
      phoneMasked: birthday.phoneMasked,
      email: birthday.email,
      photoUrl: birthday.photoUrl,
      birthdayDate: birthday.birthdayDate,
      themePreference: birthday.themePreference,
      createdAt: birthday.createdAt,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch birthday details' }, 500);
  }
});

// 5. Get Admin Birthday Details (Full stats + wishes + PIN verification)
birthdayRoutes.get('/birthdays/:token/admin', async (c) => {
  try {
    const token = c.req.param('token');
    const pin = c.req.query('pin');
    const birthday = await d1.getBirthdayByToken(c.env.DB, token);

    if (!birthday) {
      return c.json({ error: 'Birthday event not found' }, 404);
    }

    if (pin && birthday.adminPin !== pin) {
      return c.json({ error: 'Invalid admin PIN' }, 401);
    }

    const wishes = await d1.getWishesByToken(c.env.DB, token);

    return c.json({
      ...birthday,
      wishes,
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch admin details' }, 500);
  }
});

// 6. Submit Birthday Wish (Enforces 2-Day active window)
birthdayRoutes.post('/birthdays/:token/wishes', async (c) => {
  try {
    const token = c.req.param('token');
    const birthday = await d1.getBirthdayByToken(c.env.DB, token);

    if (!birthday) {
      return c.json({ error: 'Birthday event not found' }, 404);
    }

    // 2-Day active window enforcement (Day 0 + Day 1 only)
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    let isExpired = false;

    if (birthday.birthdayDate) {
      const parts = birthday.birthdayDate.split('-');
      if (parts.length === 3) {
        const bdayDate = new Date(now.getFullYear(), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const diffDays = Math.round((bdayDate.getTime() - todayMidnight.getTime()) / msPerDay);
        if (diffDays < -1) {
          isExpired = true;
        }
      }
    } else if (birthday.createdAt) {
      const createdDate = new Date(birthday.createdAt);
      const elapsedDays = (now.getTime() - createdDate.getTime()) / msPerDay;
      if (elapsedDays > 2) {
        isExpired = true;
      }
    }

    if (isExpired) {
      return c.json({ error: 'The 2-day birthday celebration wishing period has ended.' }, 403);
    }

    const body = await c.req.json().catch(() => ({}));
    const { senderName, message, imageUrl, videoUrl, theme, deliveryMethod } = body;

    if (!senderName || typeof senderName !== 'string' || senderName.trim().length === 0) {
      return c.json({ error: 'Sender name is required' }, 400);
    }

    const cleanMessage = (message || '').toString().slice(0, 600).trim();

    const newWish: Wish = {
      id: nanoid(10),
      birthdayToken: token,
      senderName: senderName.trim(),
      message: cleanMessage,
      imageUrl: imageUrl || undefined,
      videoUrl: videoUrl || undefined,
      theme: theme || 'gold',
      deliveryMethod: deliveryMethod || 'whatsapp',
      createdAt: new Date().toISOString(),
    };

    const savedWish = await d1.addWish(c.env.DB, token, newWish);
    return c.json(savedWish, 201);
  } catch (err: any) {
    console.error('Submit wish error:', err);
    return c.json({ error: err.message || 'Failed to submit wish' }, 500);
  }
});

// 7. Get Wishes For Birthday (Restricted to Admin authentication)
birthdayRoutes.get('/birthdays/:token/wishes', async (c) => {
  try {
    const token = c.req.param('token');
    const pin = c.req.query('pin');
    const birthday = await d1.getBirthdayByToken(c.env.DB, token);

    if (!birthday) {
      return c.json({ error: 'Birthday event not found' }, 404);
    }

    if (!pin || birthday.adminPin !== pin) {
      return c.json({ error: 'Unauthorized: Received wishes are private to the organizer' }, 401);
    }

    const wishes = await d1.getWishesByToken(c.env.DB, token);
    return c.json(wishes);
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch wishes' }, 500);
  }
});

// 8. Track Delivery Share Trigger
birthdayRoutes.post('/birthdays/:token/track-share', async (c) => {
  try {
    const token = c.req.param('token');
    const body = await c.req.json().catch(() => ({}));
    const { method } = body;

    if (['whatsapp', 'sms', 'email'].includes(method)) {
      await d1.trackShare(c.env.DB, token, method);
    }

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false });
  }
});

// 9. Delete a wish (Moderation)
birthdayRoutes.delete('/birthdays/:token/wishes/:wishId', async (c) => {
  try {
    const token = c.req.param('token');
    const wishId = c.req.param('wishId');
    const success = await d1.deleteWish(c.env.DB, token, wishId);
    if (success) {
      return c.json({ success: true, message: 'Wish removed' });
    }
    return c.json({ error: 'Wish not found' }, 404);
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to delete wish' }, 500);
  }
});

// 10. Get Specific Recipient Wish (Publicly viewable by the recipient with 3D card)
birthdayRoutes.get('/wishes/:wishId', async (c) => {
  try {
    const wishId = c.req.param('wishId');
    const result = await d1.getWishById(c.env.DB, wishId);
    if (!result) {
      return c.json({ error: 'Birthday wish card not found or link has expired' }, 404);
    }

    return c.json({
      wish: result.wish,
      birthday: {
        publicToken: result.birthday.publicToken,
        name: result.birthday.name,
        photoUrl: result.birthday.photoUrl,
        birthdayDate: result.birthday.birthdayDate,
        themePreference: result.birthday.themePreference,
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to load wish card' }, 500);
  }
});
