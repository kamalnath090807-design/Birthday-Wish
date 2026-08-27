import { BirthdayEvent, Wish } from '../types';
import { localStore } from './localStore';
import { isValidUploadFile } from '../utils/fileValidation';

const API_BASE = ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '/api').replace(/\/$/, '');

// Listener system for server cold-start wake state
type WakeStatusListener = (isWaking: boolean, attempt: number) => void;
const wakeListeners: Set<WakeStatusListener> = new Set();

export function onServerWakeStatus(listener: WakeStatusListener): () => void {
  wakeListeners.add(listener);
  return () => wakeListeners.delete(listener);
}

function notifyWakeStatus(isWaking: boolean, attempt: number = 0) {
  wakeListeners.forEach((fn) => fn(isWaking, attempt));
}

/**
 * Resilient edge fetch with quick retry for network fluctuations
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries: number = 2): Promise<Response> {
  let attempt = 0;
  const backoffDelays = [500, 1500];

  while (attempt <= maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if ([502, 503, 504].includes(response.status) && attempt < maxRetries) {
        attempt++;
        notifyWakeStatus(true, attempt);
        const delay = backoffDelays[attempt - 1] || 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      notifyWakeStatus(false, 0);
      return response;
    } catch (err: any) {
      if (attempt < maxRetries) {
        attempt++;
        notifyWakeStatus(true, attempt);
        const delay = backoffDelays[attempt - 1] || 1000;
        await new Promise((r) => setTimeout(r, delay));
      } else {
        notifyWakeStatus(false, 0);
        throw err;
      }
    }
  }

  notifyWakeStatus(false, 0);
  throw new Error('Request timed out. Please refresh in a moment.');
}

export const api = {
  // 1. Upload media (photo or video) with 72-hour temporary lifespan
  async uploadMedia(file: unknown): Promise<{
    url: string;
    type?: 'image' | 'video';
    assetId?: string;
    publicId?: string;
    resourceType?: 'image' | 'video';
    expiresAt?: string;
  }> {
    if (!isValidUploadFile(file)) {
      throw new Error('No valid file selected for upload.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetchWithRetry(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as any;
      throw new Error(data.error || 'Failed to upload media');
    }

    return res.json() as Promise<{
      url: string;
      type?: 'image' | 'video';
      assetId?: string;
      publicId?: string;
      resourceType?: 'image' | 'video';
      expiresAt?: string;
    }>;
  },

  // 2. Create birthday event (saved to server + cached locally)
  async createBirthday(data: {
    name: string;
    phone: string;
    email?: string;
    photoUrl?: string;
    birthdayDate?: string;
    themePreference?: string;
    adminPin?: string;
  }): Promise<BirthdayEvent> {
    const res = await fetchWithRetry(`${API_BASE}/birthdays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as any;
      throw new Error(err.error || 'Failed to create birthday page');
    }

    const created = (await res.json()) as BirthdayEvent;
    // Cache in local storage for zero-loss recovery
    localStore.saveBirthday(created);
    return created;
  },

  // 3. Get all birthdays (admin directory) with local merge
  async getAllBirthdays(): Promise<BirthdayEvent[]> {
    try {
      const res = await fetchWithRetry(`${API_BASE}/birthdays`);
      if (res.ok) {
        const serverList: BirthdayEvent[] = await res.json();
        // Cache server list in localStore
        serverList.forEach((b) => localStore.saveBirthday(b));
        return serverList;
      }
    } catch (e) {
      console.warn('Network fetch birthdays failed, falling back to local cache:', e);
    }
    // Fallback to local storage
    return localStore.getAllBirthdays();
  },

  // 4. Get public birthday page details (with resilient local fallback & sync)
  async getPublicBirthday(token: string): Promise<BirthdayEvent> {
    try {
      const res = await fetchWithRetry(`${API_BASE}/birthdays/${token}`);
      if (res.ok) {
        const data: BirthdayEvent = await res.json();
        localStore.saveBirthday(data);
        return data;
      }
    } catch (e) {
      console.warn(`Could not reach server for token ${token}, checking local cache:`, e);
    }

    // Check local fallback
    const cached = localStore.getBirthdayByToken(token);
    if (cached) {
      // Re-sync this birthday back to server in the background once online
      this.syncBirthdayToServer(cached).catch(() => {});
      return cached;
    }

    throw new Error('Birthday page not found or server is still waking up.');
  },

  // 5. Get admin birthday details with stats and wishes
  async getAdminBirthday(token: string, pin?: string): Promise<BirthdayEvent & { wishes: Wish[] }> {
    const url = pin ? `${API_BASE}/birthdays/${token}/admin?pin=${encodeURIComponent(pin)}` : `${API_BASE}/birthdays/${token}/admin`;
    try {
      const res = await fetchWithRetry(url);
      if (res.ok) {
        const data = (await res.json()) as BirthdayEvent & { wishes: Wish[] };
        localStore.saveBirthday(data);
        if (data.wishes) {
          localStore.mergeWishes(token, data.wishes);
        }
        return data;
      }
      if (res.status === 401) {
        throw new Error('Unauthorized admin PIN');
      }
    } catch (e: any) {
      if (e.message?.includes('Unauthorized')) throw e;
    }

    // Local fallback
    const cachedBday = localStore.getBirthdayByToken(token);
    if (cachedBday) {
      const localWishes = localStore.getWishesByToken(token);
      return {
        ...cachedBday,
        wishes: localWishes,
      };
    }

    throw new Error('Unauthorized or birthday not found');
  },

  // 6. Submit a wish (persists to server + local store)
  async submitWish(token: string, wish: {
    senderName: string;
    message?: string;
    imageUrl?: string;
    videoUrl?: string;
    theme: string;
    deliveryMethod?: string;
  }): Promise<Wish> {
    let savedWish: Wish;

    try {
      const res = await fetchWithRetry(`${API_BASE}/birthdays/${token}/wishes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wish),
      });

      if (res.ok) {
        savedWish = await res.json();
        localStore.saveWish(token, savedWish);
        return savedWish;
      }
    } catch (e) {
      console.warn('Direct server submit wish error, saving locally:', e);
    }

    // Fallback wish object if network failed
    savedWish = {
      id: `local-${Date.now()}`,
      birthdayToken: token,
      senderName: wish.senderName,
      message: wish.message || '',
      imageUrl: wish.imageUrl,
      videoUrl: wish.videoUrl,
      theme: wish.theme as any,
      deliveryMethod: wish.deliveryMethod as any,
      createdAt: new Date().toISOString(),
    };

    localStore.saveWish(token, savedWish);
    return savedWish;
  },

  // 7. Get wishes for a birthday
  async getWishes(token: string): Promise<Wish[]> {
    try {
      const res = await fetchWithRetry(`${API_BASE}/birthdays/${token}/wishes`);
      if (res.ok) {
        const serverWishes: Wish[] = await res.json();
        return localStore.mergeWishes(token, serverWishes);
      }
    } catch (e) {
      console.warn('Fetch server wishes failed, using local:', e);
    }
    return localStore.getWishesByToken(token);
  },

  // 8. Track share trigger
  async trackShare(token: string, method: 'whatsapp' | 'sms' | 'email'): Promise<void> {
    try {
      await fetch(`${API_BASE}/birthdays/${token}/track-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });
    } catch (e) {}
  },

  // 9. Delete a wish
  async deleteWish(token: string, wishId: string): Promise<void> {
    const res = await fetchWithRetry(`${API_BASE}/birthdays/${token}/wishes/${wishId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete wish');
  },

  // 10. Self-healing background sync: Re-sync cached birthday to server if Render wiped memory
  async syncBirthdayToServer(birthday: BirthdayEvent): Promise<void> {
    try {
      await fetch(`${API_BASE}/birthdays/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthday }),
      });
    } catch (e) {
      // Ignored
    }
  },

  // 12. Get specific recipient wish and birthday by wishId
  async getWishById(wishId: string): Promise<{ wish: Wish; birthday: BirthdayEvent }> {
    try {
      const res = await fetchWithRetry(`${API_BASE}/wishes/${wishId}`);
      if (res.ok) {
        const data = (await res.json()) as { wish: Wish; birthday: BirthdayEvent };
        if (data.wish && data.birthday) {
          localStore.saveWish(data.wish.birthdayToken, data.wish);
          localStore.saveBirthday(data.birthday);
          return data;
        }
      }
    } catch (e) {
      console.warn('Fetch wish by ID failed, trying localStore:', e);
    }

    const localMatch = localStore.getWishById(wishId);
    if (localMatch) {
      return localMatch;
    }

    throw new Error('Birthday wish card not found or link has expired.');
  },
};
