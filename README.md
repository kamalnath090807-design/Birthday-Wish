# 🎂 Birthday Magic Platform (Cloudflare Workers Architecture)

<div align="center">

<img src="./docs/hero-banner.jpg" alt="Birthday Magic Platform Live Demo" width="100%" style="border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />

<br/>

**A luxury, mobile-first birthday wish platform designed for personalized celebration hubs, interactive 3D digital greeting cards, and multi-channel sharing via WhatsApp, SMS, and Email.**

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers_Deploy-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare_D1-Database-F38020?style=for-the-badge&logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-75%20Passed-emerald?style=for-the-badge)](./test-suite.ts)

</div>

---

## 🌟 Architecture Overview

```
                        [ Browser / Client ]
                                 │
                     https://<domain>.workers.dev
                                 │
                  ┌──────────────┴──────────────┐
                  ▼                             ▼
               /api/*                  All Other Routes
         [ Cloudflare Worker ]        [ Cloudflare Assets ]
                 │                             │
        ┌────────┴────────┐                    ▼
        ▼                 ▼           [ Vite Dist / SPA ]
 [ Cloudflare D1 ]   [ Cloudinary ]   (index.html & assets)
 (SQL Database)     (72h Temp Media)
        ▲                 ▲
        └──── Cron ───────┘ (Hourly Auto Deletion)
```

1. **Frontend**: React 19 + Vite + Tailwind CSS + Framer Motion, served with global sub-millisecond edge latency via Cloudflare Workers Static Assets with SPA fallback.
2. **Backend API**: Cloudflare Worker running Hono edge router with native TypeScript support, handling all `/api/*` routes.
3. **Database**: Cloudflare D1 Serverless SQL database storing birthdays, wishes, and temporary media tracking.
4. **Temporary 72-Hour Media Storage**: Photos and video greetings are temporarily stored for ~3 days (72 hours) and automatically cleaned up via Cloudflare Cron Triggers.
5. **100% Free Zero-Cost Tier**: Deploys without requiring a credit card or paid storage activation.

---

## 🌟 Key Features

### 1. 🎁 Dedicated Recipient 3D Wish Experience (`/wish/:wishId`)
When a friend sends a wish link, the birthday person receives a link directly to their **personal 3D card experience**:
* **Celebratory Header**: Displays celebratory atmosphere, fanfare sound, and sparkling animations.
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
  * Magic Inspirations swap to warm belated templates.
  * WhatsApp, SMS, and Email pre-fill `*🎂 BELATED HAPPY BIRTHDAY [NAME]! 🎂*`.
* **Day 2+ (Expired / Wishes Closed)**:
  * Closes the public wishing form with a respectful **"Celebration Concluded"** screen.
  * Backend API rejects late submissions with `403 Forbidden`.
  * The Admin can still log into `/admin/:token` at any time to view all preserved wishes.

---

### 3. 🧹 Automated 72-Hour Media Lifecycle & Hourly Cleanup
* **Temporary Lifespan**: Uploaded profile photos and video greetings are active for ~72 hours (3 days).
* **Hourly Cron Worker (`0 * * * *`)**: Cloudflare Workers Cron Trigger automatically queries expired assets from D1 `temporary_media`, deletes them from Cloudinary using server-authenticated signatures, and nullifies references in `birthdays` and `wishes`.
* **Zero Client Secret Exposure**: All Cloudinary API keys and deletion secrets are executed server-side inside Cloudflare Worker environment variables.

---

### 4. 💬 Robust WhatsApp & SMS Formatting Engine
* **Emoji Sanitization (`cleanWhatsAppText`)**: Strips invisible UTF-8 variation selectors (`\uFE0F`) that cause WhatsApp Web and Windows to display broken `???` symbols.
* **Direct Official Endpoints**: Uses official direct endpoints (`https://api.whatsapp.com/send/?phone=...`).
* **Automatic Phone Country Code Normalization**: Automatically prefixes Indian numbers (+91) for seamless one-tap WhatsApp launches.
* **Rich Markdown Formatting**: Bold headers (`*bold*`), quotes, and direct links to the 3D card experience.

---

### 5. 🔒 Privacy Protection & Admin Isolation
* **Zero Admin Links on Public Pages**: When visitors open `/birthday/:token` or `/wish/:wishId`, the navbar hides all links to the Admin Hub and Create Page.
* **Private Wish Feed & Counters**: Received wishes, sender names, and total counts are strictly hidden from public pages and require the **Admin PIN** (`/api/birthdays/:token/wishes?pin=...`).
* **Admin Dashboard (`/admin/:token`)**: Organizers can view wish counters, sender details, moderate wishes, and download QR codes.

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

## 📡 API Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status | Public |
| `GET` | `/api/ping` | Edge worker heartbeat | Public |
| `POST` | `/api/validate-phone`| Validate & normalize Indian mobile numbers | Public |
| `POST` | `/api/birthdays` | Create a new birthday event (returns 201) | Public |
| `POST` | `/api/birthdays/sync` | Cached birthday restore / sync | Public |
| `GET` | `/api/birthdays` | List sanitized birthdays | Public |
| `GET` | `/api/birthdays/:token` | Get sanitized public birthday info | Public |
| `GET` | `/api/birthdays/:token/admin` | Get admin dashboard data (requires PIN) | Admin |
| `POST` | `/api/birthdays/:token/wishes` | Submit wish (enforces 2-day window) | Public |
| `GET` | `/api/birthdays/:token/wishes` | Get list of wishes (requires PIN) | Admin |
| `POST` | `/api/birthdays/:token/track-share` | Track WhatsApp / SMS / Email share stats | Public |
| `DELETE`| `/api/birthdays/:token/wishes/:wishId`| Delete/moderate a wish | Admin |
| `GET` | `/api/wishes/:wishId` | Get dedicated 3D recipient wish & card | Public |
| `POST` | `/api/upload` | Temporary media upload endpoint (72-hour lifespan) | Public |
| `POST` | `/api/admin/cleanup` | Manual trigger for temporary media cleanup | Admin |

---

## 🚀 Cloudflare Deployment Guide

### Step 1: Create Cloudflare D1 Database
```bash
npx wrangler d1 create birthday-wish-db
```
Copy the output `database_id` and paste it into `wrangler.jsonc`.

### Step 2: Configure Cloudinary Temporary Media Secrets (Optional)
To enable photos & video greetings with 72-hour auto deletion:
```bash
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
```

### Step 3: Run Database Migrations
For local development:
```bash
npm run db:migrate:local
```
For production on Cloudflare:
```bash
npm run db:migrate:remote
```

### Step 4: Deploy to Cloudflare Workers
```bash
npm run deploy
```

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Apply local D1 schema (0001 & 0002 migrations)
npm run db:migrate:local

# 3. Start local development (Worker + Vite frontend concurrently)
npm run dev

# 4. Run automated test suite (75 Unit & Integration Tests)
npm test

# 5. Build production bundle
npm run build
```

---

## 📄 License

This project is licensed under the MIT License. Built with ❤️ for unforgettable celebrations.
