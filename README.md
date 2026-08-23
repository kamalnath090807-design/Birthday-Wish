# 🎂 Birthday Magic Platform

A premium, mobile-first birthday wish platform where users can create personalized birthday celebration hubs, generate 3D digital cards, and share heartfelt greetings via WhatsApp, SMS, or email with unique links and QR codes.

---

## 🌟 Key Features

1. **Dynamic 2-Day Birthday Experience**:
   - **Today (Day 0)**: Displays glowing celebration hero, "Happy Birthday [Name]!", 3D card greeting, and pre-filled WhatsApp/SMS/Email wishes with `HAPPY BIRTHDAY`.
   - **Next Day (Day +1 / Belated)**: Automatically transforms to **"Belated Happy Birthday [Name]!"**, heartwarming belated prompt inspirations, and `BELATED HAPPY BIRTHDAY` messaging so late wishes feel special!
   - **Countdown & Memory Hub**: Shows live countdown for upcoming birthdays and preserves celebrations as a memory wall.
2. **Render Production Adaptive (Zero Loss & Cold-Start Auto-Retry)**:
   - **Client-Side LocalStore Cache & Auto-Sync**: Wishes and created birthdays are mirrored in the browser so data is preserved even across free Render container restarts.
   - **Cold-Start Auto-Retry**: Automatically detects sleeping Render web services and retries requests with an animated "Waking up server on Render..." indicator.
   - **Keep-Alive Ping Endpoint**: `/api/ping` endpoint to keep Render active 24/7 with free ping services (cron-job.org / UptimeRobot).
   - **Cloud Database Support**: Seamless zero-config in-memory/local storage + MongoDB Atlas support.
3. **Multi-Channel Delivery**:
   - One-tap formatted delivery for Indian mobile numbers (+91) via WhatsApp, SMS, Email, or Web Share API.
4. **Interactive 3D Greeting Cards**:
   - 6 Luxury visual themes (Royal Gold, Festive Confetti, Pastel Dream, Cyber Neon, Minimal Luxe, Starlight Galaxy) with HD image download.

---

## 🚀 Deploying on Render (Step-by-Step)

### Render Configuration:
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

### Environment Variables on Render (Dashboard -> Environment):
| Variable | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `MONGODB_URI` | *(Optional)* | MongoDB Atlas Connection String for 100% permanent cloud storage across restarts |
| `MONGODB_DB_NAME` | `birthday_wish` | MongoDB Database Name |

### How to Keep Render Awake 24/7 (Free):
1. Create a free account on [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com).
2. Add a monitor/cron job to ping `https://<your-render-subdomain>.onrender.com/api/ping` every **10 minutes**.
3. Your Render server will now stay permanently awake with instant load times!

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start both backend and frontend concurrently
npm run dev

# Run full test suite
npx tsx test-suite.ts

# Build production bundle
npm run build
```
