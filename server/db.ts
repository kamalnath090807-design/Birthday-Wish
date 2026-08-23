import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

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

// Cached MongoDB connection for Serverless environments
let cachedMongoClient: MongoClient | null = null;
let cachedMongoDb: Db | null = null;

async function getMongoDatabase(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri || !uri.trim()) return null;

  try {
    if (cachedMongoDb && cachedMongoClient) {
      return cachedMongoDb;
    }
    const client = new MongoClient(uri.trim(), {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });
    await client.connect();
    const dbName = process.env.MONGODB_DB_NAME || 'birthday_wish';
    cachedMongoClient = client;
    cachedMongoDb = client.db(dbName);
    console.log('🍃 Connected successfully to MongoDB Atlas database:', dbName);
    return cachedMongoDb;
  } catch (err) {
    console.warn('⚠️ MongoDB Atlas connection skipped/failed, using in-memory store:', (err as Error).message);
    return null;
  }
}

class DatabaseStore {
  private data: DatabaseSchema = {
    birthdays: {},
    wishes: {},
  };
  private isFileStorageAvailable = false;

  constructor() {
    this.init();
  }

  private init() {
    // Seed default demo birthday
    this.seedDefault();

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.birthdays && parsed.wishes) {
          this.data = parsed;
        }
      } else {
        this.saveToFile();
      }
      this.isFileStorageAvailable = true;
    } catch (err) {
      // In serverless / read-only environments (Vercel), fs write is restricted
      this.isFileStorageAvailable = false;
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
      birthdayDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
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

  private saveToFile() {
    if (!this.isFileStorageAvailable) return;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      // Ignore if read-only
    }
  }

  public async getBirthdayByToken(token: string): Promise<BirthdayEvent | undefined> {
    const mongo = await getMongoDatabase();
    if (mongo) {
      try {
        const doc = await mongo.collection('birthdays').findOne({ publicToken: token }, { projection: { _id: 0 } });
        if (doc) return doc as unknown as BirthdayEvent;
      } catch (err) {
        console.error('Mongo query error in getBirthdayByToken:', err);
      }
    }
    return this.data.birthdays[token];
  }

  public async getBirthdayById(id: string): Promise<BirthdayEvent | undefined> {
    const mongo = await getMongoDatabase();
    if (mongo) {
      try {
        const doc = await mongo.collection('birthdays').findOne({ id }, { projection: { _id: 0 } });
        if (doc) return doc as unknown as BirthdayEvent;
      } catch (err) {
        console.error('Mongo query error in getBirthdayById:', err);
      }
    }
    return Object.values(this.data.birthdays).find(b => b.id === id);
  }

  public async getAllBirthdays(): Promise<BirthdayEvent[]> {
    const mongo = await getMongoDatabase();
    if (mongo) {
      try {
        const list = await mongo.collection('birthdays').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
        if (list && list.length > 0) return list as unknown as BirthdayEvent[];
      } catch (err) {
        console.error('Mongo query error in getAllBirthdays:', err);
      }
    }
    return Object.values(this.data.birthdays).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async createBirthday(event: BirthdayEvent): Promise<BirthdayEvent> {
    this.data.birthdays[event.publicToken] = event;
    if (!this.data.wishes[event.publicToken]) {
      this.data.wishes[event.publicToken] = [];
    }
    this.saveToFile();

    const mongo = await getMongoDatabase();
    if (mongo) {
      try {
        await mongo.collection('birthdays').updateOne(
          { publicToken: event.publicToken },
          { $set: event },
          { upsert: true }
        );
      } catch (err) {
        console.error('Mongo save error in createBirthday:', err);
      }
    }
    return event;
  }

  public async addWish(token: string, wish: Wish): Promise<Wish> {
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

    this.saveToFile();

    const mongo = await getMongoDatabase();
    if (mongo) {
      try {
        await mongo.collection('wishes').insertOne({ ...wish });
        const incUpdate: Record<string, number> = { 'stats.totalWishes': 1 };
        if (wish.imageUrl) incUpdate['stats.imagesReceived'] = 1;
        if (wish.videoUrl) incUpdate['stats.videosReceived'] = 1;
        if (wish.deliveryMethod === 'whatsapp') incUpdate['stats.whatsappShares'] = 1;
        if (wish.deliveryMethod === 'sms') incUpdate['stats.smsShares'] = 1;
        if (wish.deliveryMethod === 'email') incUpdate['stats.emailShares'] = 1;

        await mongo.collection('birthdays').updateOne(
          { publicToken: token },
          { $inc: incUpdate }
        );
      } catch (err) {
        console.error('Mongo save error in addWish:', err);
      }
    }

    return wish;
  }

  public async getWishesByToken(token: string): Promise<Wish[]> {
    const mongo = await getMongoDatabase();
    if (mongo) {
      try {
        const list = await mongo.collection('wishes').find({ birthdayToken: token }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
        if (list && list.length > 0) return list as unknown as Wish[];
      } catch (err) {
        console.error('Mongo query error in getWishesByToken:', err);
      }
    }
    return this.data.wishes[token] || [];
  }

  public async trackShare(token: string, method: 'whatsapp' | 'sms' | 'email'): Promise<void> {
    const bday = this.data.birthdays[token];
    if (bday) {
      if (method === 'whatsapp') bday.stats.whatsappShares += 1;
      if (method === 'sms') bday.stats.smsShares += 1;
      if (method === 'email') bday.stats.emailShares += 1;
      this.saveToFile();
    }

    const mongo = await getMongoDatabase();
    if (mongo) {
      try {
        const field = method === 'whatsapp' ? 'stats.whatsappShares' : method === 'sms' ? 'stats.smsShares' : 'stats.emailShares';
        await mongo.collection('birthdays').updateOne(
          { publicToken: token },
          { $inc: { [field]: 1 } }
        );
      } catch (err) {
        console.error('Mongo update error in trackShare:', err);
      }
    }
  }

  public async deleteWish(token: string, wishId: string): Promise<boolean> {
    let deleted = false;
    if (this.data.wishes[token]) {
      const idx = this.data.wishes[token].findIndex(w => w.id === wishId);
      if (idx !== -1) {
        this.data.wishes[token].splice(idx, 1);
        const bday = this.data.birthdays[token];
        if (bday && bday.stats.totalWishes > 0) {
          bday.stats.totalWishes -= 1;
        }
        this.saveToFile();
        deleted = true;
      }
    }

    const mongo = await getMongoDatabase();
    if (mongo) {
      try {
        const res = await mongo.collection('wishes').deleteOne({ id: wishId, birthdayToken: token });
        if (res.deletedCount > 0) {
          await mongo.collection('birthdays').updateOne(
            { publicToken: token, 'stats.totalWishes': { $gt: 0 } },
            { $inc: { 'stats.totalWishes': -1 } }
          );
          deleted = true;
        }
      } catch (err) {
        console.error('Mongo delete error in deleteWish:', err);
      }
    }

    return deleted;
  }

  public async getWishById(wishId: string): Promise<{ wish: Wish; birthday: BirthdayEvent } | undefined> {
    const mongo = await getMongoDatabase();
    if (mongo) {
      try {
        const wishDoc = await mongo.collection('wishes').findOne({ id: wishId }, { projection: { _id: 0 } });
        if (wishDoc) {
          const wish = wishDoc as unknown as Wish;
          const bdayDoc = await mongo.collection('birthdays').findOne({ publicToken: wish.birthdayToken }, { projection: { _id: 0 } });
          if (bdayDoc) {
            return {
              wish,
              birthday: bdayDoc as unknown as BirthdayEvent,
            };
          }
        }
      } catch (err) {
        console.error('Mongo query error in getWishById:', err);
      }
    }

    for (const token in this.data.wishes) {
      const wish = this.data.wishes[token]?.find((w) => w.id === wishId);
      if (wish) {
        const birthday = this.data.birthdays[token];
        if (birthday) {
          return { wish, birthday };
        }
      }
    }
    return undefined;
  }
}

export const db = new DatabaseStore();
