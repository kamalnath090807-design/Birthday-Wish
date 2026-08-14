import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import { db, BirthdayEvent, Wish } from './db.js';
import { validateAndNormalizeIndianPhone } from './utils/phone.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload directory exists for local disk fallback
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  // Serve uploaded media statically if local disk exists
  app.use('/uploads', express.static(UPLOADS_DIR));
} catch (e) {
  // In serverless / read-only environments, ignore
}

// Multer in-memory storage for serverless compatibility
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedMimes = [...allowedImageMimes, ...allowedVideoMimes];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type (${file.mimetype}). Please upload JPG, PNG, WEBP or MP4.`));
    }
  },
});

// Helper to create slug from name
function createSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const rand = nanoid(5).toLowerCase();
  return `${base || 'birthday'}-${rand}`;
}

// --- ROUTES ---

// 1. Upload Media Endpoint (Memory -> Base64 or Cloudinary or Local Disk)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const ext = path.extname(req.file.originalname).toLowerCase() || (isVideo ? '.mp4' : '.jpg');
    const safeName = `${Date.now()}-${nanoid(8)}${ext}`;

    let fileUrl: string;

    // Optional Cloudinary Upload if credentials exist
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      try {
        const formData = new FormData();
        const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        formData.append('file', base64Data);
        formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || 'unsigned_birthday');

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: formData,
        });

        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          fileUrl = cloudData.secure_url;
        } else {
          // Fallback to Base64 data URL
          fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }
      } catch (err) {
        console.warn('Cloudinary upload fallback to base64:', err);
        fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }
    } else {
      // If local filesystem writable, also save to disk for /uploads serving
      try {
        const diskPath = path.join(UPLOADS_DIR, safeName);
        fs.writeFileSync(diskPath, req.file.buffer);
        fileUrl = `/uploads/${safeName}`;
      } catch (e) {
        // Fallback to Data URL for serverless Vercel
        fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }
    }

    return res.json({
      url: fileUrl,
      type: isVideo ? 'video' : 'image',
      filename: safeName,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message || 'File upload failed' });
  }
});

// 2. Validate Indian Phone Endpoint
app.post('/api/validate-phone', (req, res) => {
  const { phone } = req.body;
  const result = validateAndNormalizeIndianPhone(phone);
  return res.json(result);
});

// 3. Create Birthday Event
app.post('/api/birthdays', async (req, res) => {
  try {
    const { name, phone, email, photoUrl, birthdayDate, themePreference, adminPin } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: "Birthday person's name is required" });
    }

    const phoneValidation = validateAndNormalizeIndianPhone(phone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ error: phoneValidation.error || 'Invalid Indian phone number' });
    }

    let validEmail = '';
    if (email && typeof email === 'string' && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Invalid email address format' });
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

    const saved = await db.createBirthday(newBirthday);
    return res.status(201).json(saved);
  } catch (err: any) {
    console.error('Create birthday error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create birthday page' });
  }
});

// 4. List All Birthdays (for admin directory / switcher)
app.get('/api/birthdays', async (_req, res) => {
  const list = await db.getAllBirthdays();
  const sanitized = list.map(b => ({
    id: b.id,
    publicToken: b.publicToken,
    name: b.name,
    photoUrl: b.photoUrl,
    birthdayDate: b.birthdayDate,
    createdAt: b.createdAt,
    stats: b.stats,
  }));
  return res.json(sanitized);
});

// 5. Get Public Birthday Details
app.get('/api/birthdays/:token', async (req, res) => {
  const { token } = req.params;
  const birthday = await db.getBirthdayByToken(token);

  if (!birthday) {
    return res.status(404).json({ error: 'Birthday event not found' });
  }

  return res.json({
    publicToken: birthday.publicToken,
    name: birthday.name,
    phone: birthday.phone,
    phoneMasked: birthday.phoneMasked,
    email: birthday.email,
    photoUrl: birthday.photoUrl,
    birthdayDate: birthday.birthdayDate,
    themePreference: birthday.themePreference,
    createdAt: birthday.createdAt,
    totalWishes: birthday.stats?.totalWishes || 0,
  });
});

// 6. Get Admin Birthday Details (Full stats + wishes + PIN verification)
app.get('/api/birthdays/:token/admin', async (req, res) => {
  const { token } = req.params;
  const pin = req.query.pin as string;
  const birthday = await db.getBirthdayByToken(token);

  if (!birthday) {
    return res.status(404).json({ error: 'Birthday event not found' });
  }

  if (pin && birthday.adminPin !== pin) {
    return res.status(401).json({ error: 'Invalid admin PIN' });
  }

  const wishes = await db.getWishesByToken(token);

  return res.json({
    ...birthday,
    wishes,
  });
});

// 7. Submit Birthday Wish
app.post('/api/birthdays/:token/wishes', async (req, res) => {
  try {
    const { token } = req.params;
    const birthday = await db.getBirthdayByToken(token);

    if (!birthday) {
      return res.status(404).json({ error: 'Birthday event not found' });
    }

    const { senderName, message, imageUrl, videoUrl, theme, deliveryMethod } = req.body;

    if (!senderName || typeof senderName !== 'string' || senderName.trim().length === 0) {
      return res.status(400).json({ error: 'Sender name is required' });
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

    const savedWish = await db.addWish(token, newWish);
    return res.status(201).json(savedWish);
  } catch (err: any) {
    console.error('Submit wish error:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit wish' });
  }
});

// 8. Get Wishes For Birthday
app.get('/api/birthdays/:token/wishes', async (req, res) => {
  const { token } = req.params;
  const wishes = await db.getWishesByToken(token);
  return res.json(wishes);
});

// 9. Track Delivery Share Trigger
app.post('/api/birthdays/:token/track-share', async (req, res) => {
  const { token } = req.params;
  const { method } = req.body;

  if (['whatsapp', 'sms', 'email'].includes(method)) {
    await db.trackShare(token, method);
  }

  return res.json({ success: true });
});

// 10. Delete a wish (Moderation)
app.delete('/api/birthdays/:token/wishes/:wishId', async (req, res) => {
  const { token, wishId } = req.params;
  const success = await db.deleteWish(token, wishId);
  if (success) {
    return res.json({ success: true, message: 'Wish removed' });
  }
  return res.status(404).json({ error: 'Wish not found' });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV || 'development' });
});
