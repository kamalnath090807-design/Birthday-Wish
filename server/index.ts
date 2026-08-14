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

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure upload directory exists
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded media statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer for secure file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${nanoid(8)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB max
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

// 1. Upload Media Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const fileUrl = `/uploads/${req.file.filename}`;

    return res.json({
      url: fileUrl,
      type: isVideo ? 'video' : 'image',
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message || 'File upload failed' });
  }
});

// 2. Validate Indian Phone Endpoint (Live Helper)
app.post('/api/validate-phone', (req, res) => {
  const { phone } = req.body;
  const result = validateAndNormalizeIndianPhone(phone);
  return res.json(result);
});

// 3. Create Birthday Event
app.post('/api/birthdays', (req, res) => {
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

    const saved = db.createBirthday(newBirthday);
    return res.status(201).json(saved);
  } catch (err: any) {
    console.error('Create birthday error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create birthday page' });
  }
});

// 4. List All Birthdays (for admin directory / switcher)
app.get('/api/birthdays', (_req, res) => {
  const list = db.getAllBirthdays();
  // Return safe summary
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

// 5. Get Public Birthday Details (Sanitized for friends/guests)
app.get('/api/birthdays/:token', (req, res) => {
  const { token } = req.params;
  const birthday = db.getBirthdayByToken(token);

  if (!birthday) {
    return res.status(404).json({ error: 'Birthday event not found' });
  }

  // Return public info necessary for the wish experience and deep-links
  // Keep adminPin hidden
  return res.json({
    publicToken: birthday.publicToken,
    name: birthday.name,
    phone: birthday.phone, // Normalized for deep-link WhatsApp/SMS triggers
    phoneMasked: birthday.phoneMasked,
    email: birthday.email,
    photoUrl: birthday.photoUrl,
    birthdayDate: birthday.birthdayDate,
    themePreference: birthday.themePreference,
    createdAt: birthday.createdAt,
    totalWishes: birthday.stats.totalWishes,
  });
});

// 6. Get Admin Birthday Details (Full stats + wishes + PIN verification)
app.get('/api/birthdays/:token/admin', (req, res) => {
  const { token } = req.params;
  const pin = req.query.pin as string;
  const birthday = db.getBirthdayByToken(token);

  if (!birthday) {
    return res.status(404).json({ error: 'Birthday event not found' });
  }

  // If PIN provided and does not match
  if (pin && birthday.adminPin !== pin) {
    return res.status(401).json({ error: 'Invalid admin PIN' });
  }

  const wishes = db.getWishesByToken(token);

  return res.json({
    ...birthday,
    wishes,
  });
});

// 7. Submit Birthday Wish
app.post('/api/birthdays/:token/wishes', (req, res) => {
  try {
    const { token } = req.params;
    const birthday = db.getBirthdayByToken(token);

    if (!birthday) {
      return res.status(404).json({ error: 'Birthday event not found' });
    }

    const { senderName, message, imageUrl, videoUrl, theme, deliveryMethod } = req.body;

    if (!senderName || typeof senderName !== 'string' || senderName.trim().length === 0) {
      return res.status(400).json({ error: 'Sender name is required' });
    }

    // Limit message length
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

    const savedWish = db.addWish(token, newWish);
    return res.status(201).json(savedWish);
  } catch (err: any) {
    console.error('Submit wish error:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit wish' });
  }
});

// 8. Get Wishes For Birthday
app.get('/api/birthdays/:token/wishes', (req, res) => {
  const { token } = req.params;
  const wishes = db.getWishesByToken(token);
  return res.json(wishes);
});

// 9. Track Delivery Share Trigger
app.post('/api/birthdays/:token/track-share', (req, res) => {
  const { token } = req.params;
  const { method } = req.body;

  if (['whatsapp', 'sms', 'email'].includes(method)) {
    db.trackShare(token, method);
  }

  return res.json({ success: true });
});

// 10. Delete a wish (Moderation)
app.delete('/api/birthdays/:token/wishes/:wishId', (req, res) => {
  const { token, wishId } = req.params;
  const success = db.deleteWish(token, wishId);
  if (success) {
    return res.json({ success: true, message: 'Wish removed' });
  }
  return res.status(404).json({ error: 'Wish not found' });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🎉 Birthday Wish Server running on http://localhost:${PORT}`);
});
