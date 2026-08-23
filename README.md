# 🎂 Birthday Magic Platform

<div align="center">

![Birthday Wish Platform](https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&auto=format&fit=crop&q=80)

**A luxury, mobile-first birthday wish platform designed for personalized celebration hubs, interactive 3D digital greeting cards, and multi-channel sharing via WhatsApp, SMS, and Email.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-birthday--wish--9jqz.onrender.com-ff2e93?style=for-the-badge&logo=render&logoColor=white)](https://birthday-wish-9jqz.onrender.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![Render](https://img.shields.io/badge/Render-Deployed-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://birthday-wish-9jqz.onrender.com/)
[![Tests](https://img.shields.io/badge/Tests-36%20Passed-emerald?style=for-the-badge)](./test-suite.ts)

### 🔗 **Live Application URL**: [https://birthday-wish-9jqz.onrender.com/](https://birthday-wish-9jqz.onrender.com/)

</div>

---

## 🌟 Key Features & Architecture

### 1. 🎁 Dedicated Recipient 3D Wish Experience (`/wish/:wishId`)
When a friend sends a wish link, the birthday person receives a link directly to their **personal 3D card experience** (never redirecting them to wish forms or other pages):
* **Celebratory Header**: Displays celebratory atmosphere, fanfare sound, and sparkling animations.
* **Photo Memory**: Elegant framed Polaroid memory card with subtle tilt.
* **Video Greeting**: Custom embedded glass video player.
* **Personalized Message**: Styled with warm typography, quotation cards, and love accents.
* **Interactive 3D Card**: Digital greeting card with real-time mouse/touch 3D perspective tilting, luxury card themes, and **"Save HD Card to Photos"** PNG export.
* **"Say Thank You ❤️" Button**: Pre-fills an instant WhatsApp reply to thank the sender with emojis and stylized greetings!

---

### 2. ⏳ Dynamic 2-Day Birthday Window (Today & Belated)
* **Day 0 (Birthday Day — Today)**:
  * Active wishing enabled with **"Happy Birthday [Name]!"** hero banner.
  * WhatsApp, SMS, and Email pre-fill `*🎂 HAPPY BIRTHDAY [NAME]! 🎂*`.
* **Day 1 (Next Day — Tomorrow / Belated)**:
  * Automatically transforms to **"Belated Happy Birthday [Name]!"**.
  * Magic Inspirations swap to warm belated templates (*"Belated Happy Birthday! Even though this wish is a day late, my prayers & love are always on time! 🎂✨"*).
  * WhatsApp, SMS, and Email pre-fill `*🎂 BELATED HAPPY BIRTHDAY [NAME]! 🎂*`.
* **Day 2+ (Expired / Wishes Closed)**:
  * Closes the public wishing form with a respectful **"Celebration Concluded"** screen.
  * Backend API rejects late submissions with `403 Forbidden`.
  * The Admin can still log into `/admin/:token` at any time to view all preserved wishes.

---

### 3. 💬 Robust WhatsApp & SMS Formatting Engine
* **Emoji Sanitization (`cleanWhatsAppText`)**: Strips invisible UTF-8 variation selectors (`\uFE0F`) that cause WhatsApp Web and Windows to display broken `???` / `` symbols.
* **Direct Official Endpoints**: Uses official direct endpoints (`https://api.whatsapp.com/send/?phone=...`) to avoid HTTP 302 character-set mangling.
* **Automatic Phone Country Code Normalization**: Automatically prefixes Indian numbers (+91) for seamless one-tap WhatsApp launches.
* **Rich Markdown Formatting**: Bold headers (`*bold*`), quotes, and direct links to the 3D card experience.

---

### 4. 🔒 Privacy Protection & Admin Isolation
* **Zero Admin Links on Public Pages**: When visitors open `/birthday/:token` or `/wish/:wishId`, the navbar hides all links to the Admin Hub and Create Page.
* **Private Wish Feed & Counters**: Received wishes, sender names, and total counts are strictly hidden from public pages and require the **Admin PIN** (`/api/birthdays/:token/wishes?pin=...`).
* **Admin Dashboard (`/admin/:token`)**: Organizers can view wish counters, sender details, attached photos & videos, moderate wishes, and download QR codes.

---

### 5. ⚡ Render Production Resilience
* **Dual-Layer Persistence**: Browser `localStore` auto-mirroring + `/api/birthdays/sync` background synchronization so data is never lost even if free Render containers restart.
* **Cold-Start Auto-Retry**: Built-in exponential backoff with an animated *"Waking up server on Render... ⏳"* indicator.
* **Keep-Alive Ping Endpoint**: Dedicated `/api/ping` endpoint to keep Render active 24/7 with free ping monitors.
* **Flexible Storage**: Zero-config file-based storage with automated MongoDB Atlas cloud fallback via `MONGODB_URI`.

---

## 🎨 6 Luxury 3D Card Themes

| Theme | Badge | Vibe |
| :--- | :--- | :--- |
| **Royal Gold & Velvet** | 👑 Luxury | Deep obsidian with shimmering gold foil accents & serif typography |
| **Festive Celebration** | 🎉 Vibrant | Joyful confetti, floating balloons & party vibes |
| **Pastel Dream** | 🌸 Sweet | Soft cotton candy tones with cursive script styling |
| **Cyber Neon Glow** | ⚡ Electric | Electrifying neon violet and cyan glow |
| **Minimalist Luxe** | 💎 Clean | Ultra-clean Apple-inspired soft glass gradients |
| **Starlight Galaxy** | 🌌 Cosmic | Ethereal cosmic nebula with shimmering constellations |

---

## 🚀 Live Deployment on Render

### Live URL: [https://birthday-wish-9jqz.onrender.com/](https://birthday-wish-9jqz.onrender.com/)

### Render Configuration:
* **Environment**: `Node`
* **Build Command**: `npm install && npm run build`
* **Start Command**: `npm start`
* **Health Check Path**: `/api/health`

### Environment Variables on Render (Dashboard -> Environment):
| Variable | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `5000` *(or auto-assigned)* | Server listening port |
| `MONGODB_URI` | *(Optional)* | MongoDB Atlas Connection String for 100% permanent cloud storage |
| `MONGODB_DB_NAME` | `birthday_wish` | MongoDB Database Name |

### How to Keep Render Awake 24/7 (Free):
1. Sign up on [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com).
2. Add a monitor to ping **`https://birthday-wish-9jqz.onrender.com/api/ping`** every **10 minutes**.
3. Your Render server will now stay permanently awake with instant load times!

---

## 📡 API Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status | Public |
| `GET` | `/api/ping` | Keep-alive heartbeat | Public |
| `POST` | `/api/birthdays` | Create a new birthday event | Public |
| `GET` | `/api/birthdays/:token` | Get sanitized public birthday info | Public |
| `GET` | `/api/birthdays/:token/admin` | Get admin dashboard data (requires PIN) | Admin |
| `POST` | `/api/birthdays/:token/wishes` | Submit wish (enforces 2-day window) | Public |
| `GET` | `/api/birthdays/:token/wishes` | Get list of wishes (requires PIN) | Admin |
| `GET` | `/api/wishes/:wishId` | Get dedicated 3D recipient wish & card | Public |
| `DELETE`| `/api/birthdays/:token/wishes/:id`| Delete/moderate a wish | Admin |
| `POST` | `/api/upload` | Upload memory photo or video | Public |
| `POST` | `/api/birthdays/sync` | Self-healing background restore | Public |

---

## 💻 Local Development & Testing

```bash
# 1. Clone the repository
git clone https://github.com/kamalnath090807-design/Birthday-Wish.git
cd Birthday-Wish

# 2. Install dependencies
npm install

# 3. Start development server (Frontend + Backend concurrently)
npm run dev

# 4. Run automated test suite (36 Unit & Integration Tests)
npx tsx test-suite.ts

# 5. Build production bundle
npm run build
```

---

## 🧪 Test Suite Coverage

Our automated test suite ([`test-suite.ts`](./test-suite.ts)) verifies:
* ✅ **Phone Normalization**: Indian 10-digit format and `+91` validation.
* ✅ **2-Day Dynamic Windows**: Today (Day 0), Belated (Day 1), and Expired (Day 2+).
* ✅ **WhatsApp & SMS Formatting**: Bold Markdown, clean emojis, and 3D card URLs.
* ✅ **Thank You Response Flow**: Pre-filled recipient thank you generator.
* ✅ **Express API Integration**: Health, ping, birthday creation, sync, upload, and deletion.
* ✅ **Privacy Protection**: 401 Unauthorized for wish feeds without Admin PIN, 403 Forbidden for expired wishes.

---

## 📄 License

This project is licensed under the MIT License — feel free to customize and make your celebrations memorable! Built with ❤️ for unforgettable celebrations.
