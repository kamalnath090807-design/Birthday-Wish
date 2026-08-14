import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BirthdayStats {
  totalWishes: number;
  whatsappShares: number;
  smsShares: number;
  emailShares: number;
  imagesReceived: number;
  videosReceived: number;
}

export interface BirthdayEvent {
  id: string;
  publicToken: string;
  adminPin: string;
  name: string;
  phone: string; // Normalized +919876543210
  phoneMasked: string; // +91 98*** **210
  email: string;
  photoUrl?: string;
  birthdayDate?: string;
  themePreference?: string;
  createdAt: string;
  stats: BirthdayStats;
}

export interface Wish {
  id: string;
  birthdayToken: string;
  senderName: string;
  message: string;
  imageUrl?: string;
  videoUrl?: string;
  theme: string;
  deliveryMethod?: 'whatsapp' | 'sms' | 'email' | 'download' | 'copied';
  createdAt: string;
}

interface DatabaseSchema {
  birthdays: Record<string, BirthdayEvent>; // keyed by publicToken
  wishes: Record<string, Wish[]>; // keyed by publicToken
}

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseStore {
  private data: DatabaseSchema = {
    birthdays: {},
    wishes: {},
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error loading database file, initializing empty store:', err);
        this.save();
      }
    } else {
      // Seed with a wonderful default demo birthday if empty
      this.seedDefault();
      this.save();
    }
  }

  private seedDefault() {
    const demoToken = 'arun-kumar-demo';
    const demoBirthday: BirthdayEvent = {
      id: 'demo-bday-1',
      publicToken: demoToken,
      adminPin: '1234',
      name: 'Arun Kumar',
      phone: '+919876543210',
      phoneMasked: '+91 98*** ***10',
      email: 'arun.birthday@example.com',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      birthdayDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
      themePreference: 'gold',
      createdAt: new Date().toISOString(),
      stats: {
        totalWishes: 3,
        whatsappShares: 2,
        smsShares: 1,
        emailShares: 0,
        imagesReceived: 2,
        videosReceived: 0,
      },
    };

    const demoWishes: Wish[] = [
      {
        id: 'wish-1',
        birthdayToken: demoToken,
        senderName: 'Kamal',
        message: 'Happy birthday Arun! Wishing you immense joy, great health, and tremendous success this year! Let’s celebrate soon! 🎂🎉',
        imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80',
        theme: 'gold',
        deliveryMethod: 'whatsapp',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'wish-2',
        birthdayToken: demoToken,
        senderName: 'Priya & Rahul',
        message: 'May all your dreams turn into reality this year. Have a blast and keep smiling always! ✨❤️',
        theme: 'festive',
        deliveryMethod: 'sms',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'wish-3',
        birthdayToken: demoToken,
        senderName: 'Ananya',
        message: 'Happy Birthday brother! Cheers to more late night talks and awesome adventures together! 🥳🥂',
        imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80',
        theme: 'neon',
        deliveryMethod: 'whatsapp',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    this.data.birthdays[demoToken] = demoBirthday;
    this.data.wishes[demoToken] = demoWishes;
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  public getBirthdayByToken(token: string): BirthdayEvent | undefined {
    return this.data.birthdays[token];
  }

  public getBirthdayById(id: string): BirthdayEvent | undefined {
    return Object.values(this.data.birthdays).find(b => b.id === id);
  }

  public getAllBirthdays(): BirthdayEvent[] {
    return Object.values(this.data.birthdays).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public createBirthday(event: BirthdayEvent): BirthdayEvent {
    this.data.birthdays[event.publicToken] = event;
    if (!this.data.wishes[event.publicToken]) {
      this.data.wishes[event.publicToken] = [];
    }
    this.save();
    return event;
  }

  public addWish(token: string, wish: Wish): Wish {
    if (!this.data.wishes[token]) {
      this.data.wishes[token] = [];
    }
    this.data.wishes[token].unshift(wish);

    const bday = this.data.birthdays[token];
    if (bday) {
      bday.stats.totalWishes += 1;
      if (wish.imageUrl) bday.stats.imagesReceived += 1;
      if (wish.videoUrl) bday.stats.videosReceived += 1;
      if (wish.deliveryMethod === 'whatsapp') bday.stats.whatsappShares += 1;
      if (wish.deliveryMethod === 'sms') bday.stats.smsShares += 1;
      if (wish.deliveryMethod === 'email') bday.stats.emailShares += 1;
    }

    this.save();
    return wish;
  }

  public getWishesByToken(token: string): Wish[] {
    return this.data.wishes[token] || [];
  }

  public trackShare(token: string, method: 'whatsapp' | 'sms' | 'email') {
    const bday = this.data.birthdays[token];
    if (bday) {
      if (method === 'whatsapp') bday.stats.whatsappShares += 1;
      if (method === 'sms') bday.stats.smsShares += 1;
      if (method === 'email') bday.stats.emailShares += 1;
      this.save();
    }
  }

  public deleteWish(token: string, wishId: string): boolean {
    if (this.data.wishes[token]) {
      const idx = this.data.wishes[token].findIndex(w => w.id === wishId);
      if (idx !== -1) {
        this.data.wishes[token].splice(idx, 1);
        const bday = this.data.birthdays[token];
        if (bday && bday.stats.totalWishes > 0) {
          bday.stats.totalWishes -= 1;
        }
        this.save();
        return true;
      }
    }
    return false;
  }
}

export const db = new DatabaseStore();
