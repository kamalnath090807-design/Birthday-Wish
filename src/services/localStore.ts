import { BirthdayEvent, Wish } from '../types';

const STORAGE_KEYS = {
  BIRTHDAYS: 'bm_birthdays_cache',
  WISHES_PREFIX: 'bm_wishes_',
  LAST_SYNC: 'bm_last_sync',
};

// Safe JSON parse helper
function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export const localStore = {
  /**
   * Save or update a single birthday in localStorage
   */
  saveBirthday(birthday: BirthdayEvent): void {
    try {
      const existing = this.getAllBirthdays();
      const idx = existing.findIndex((b) => b.publicToken === birthday.publicToken || b.id === birthday.id);
      if (idx >= 0) {
        existing[idx] = { ...existing[idx], ...birthday };
      } else {
        existing.unshift(birthday);
      }
      localStorage.setItem(STORAGE_KEYS.BIRTHDAYS, JSON.stringify(existing));
    } catch (e) {
      console.warn('LocalStorage save birthday error:', e);
    }
  },

  /**
   * Get a cached birthday by public token
   */
  getBirthdayByToken(token: string): BirthdayEvent | null {
    try {
      const all = this.getAllBirthdays();
      return all.find((b) => b.publicToken === token) || null;
    } catch {
      return null;
    }
  },

  /**
   * Get all cached birthdays
   */
  getAllBirthdays(): BirthdayEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BIRTHDAYS);
      return safeJsonParse<BirthdayEvent[]>(raw, []);
    } catch {
      return [];
    }
  },

  /**
   * Save a newly submitted wish into localStorage
   */
  saveWish(token: string, wish: Wish): void {
    try {
      const key = `${STORAGE_KEYS.WISHES_PREFIX}${token}`;
      const wishes = this.getWishesByToken(token);
      const exists = wishes.some((w) => w.id === wish.id);
      if (!exists) {
        wishes.unshift(wish);
        localStorage.setItem(key, JSON.stringify(wishes));
      }
      // Also save in direct global wish cache for instant lookup
      localStorage.setItem(`bm_single_wish_${wish.id}`, JSON.stringify(wish));

      // Increment local birthday total wishes count
      const bday = this.getBirthdayByToken(token);
      if (bday) {
        bday.totalWishes = (bday.totalWishes || 0) + 1;
        if (bday.stats) bday.stats.totalWishes = (bday.stats.totalWishes || 0) + 1;
        this.saveBirthday(bday);
      }
    } catch (e) {
      console.warn('LocalStorage save wish error:', e);
    }
  },

  /**
   * Get wishes for a birthday from localStorage
   */
  getWishesByToken(token: string): Wish[] {
    try {
      const key = `${STORAGE_KEYS.WISHES_PREFIX}${token}`;
      const raw = localStorage.getItem(key);
      return safeJsonParse<Wish[]>(raw, []);
    } catch {
      return [];
    }
  },

  /**
   * Look up a single wish by its wishId
   */
  getWishById(wishId: string): { wish: Wish; birthday: BirthdayEvent } | null {
    try {
      const rawDirect = localStorage.getItem(`bm_single_wish_${wishId}`);
      if (rawDirect) {
        const wish = JSON.parse(rawDirect) as Wish;
        const bday = this.getBirthdayByToken(wish.birthdayToken);
        if (bday) {
          return { wish, birthday: bday };
        }
      }

      // Search all keys
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_KEYS.WISHES_PREFIX)) {
          const list = safeJsonParse<Wish[]>(localStorage.getItem(k), []);
          const match = list.find((w) => w.id === wishId);
          if (match) {
            const bday = this.getBirthdayByToken(match.birthdayToken);
            if (bday) return { wish: match, birthday: bday };
          }
        }
      }
    } catch {}
    return null;
  },

  /**
   * Merge fetched wishes with local cached wishes
   */
  mergeWishes(token: string, serverWishes: Wish[]): Wish[] {
    const local = this.getWishesByToken(token);
    const map = new Map<string, Wish>();
    serverWishes.forEach((w) => map.set(w.id, w));
    local.forEach((w) => {
      if (!map.has(w.id)) {
        map.set(w.id, w);
      }
    });
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    try {
      localStorage.setItem(`${STORAGE_KEYS.WISHES_PREFIX}${token}`, JSON.stringify(merged));
    } catch {}
    return merged;
  },
};
