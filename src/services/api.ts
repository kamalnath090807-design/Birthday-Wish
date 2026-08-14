import { BirthdayEvent, Wish } from '../types';

const API_BASE = '/api';

export const api = {
  // 1. Upload media (photo or video)
  async uploadMedia(file: File): Promise<{ url: string; type: 'image' | 'video' }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to upload media');
    }

    return res.json();
  },

  // 2. Create birthday event
  async createBirthday(data: {
    name: string;
    phone: string;
    email?: string;
    photoUrl?: string;
    birthdayDate?: string;
    themePreference?: string;
    adminPin?: string;
  }): Promise<BirthdayEvent> {
    const res = await fetch(`${API_BASE}/birthdays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create birthday page');
    }

    return res.json();
  },

  // 3. Get all birthdays (admin list)
  async getAllBirthdays(): Promise<BirthdayEvent[]> {
    const res = await fetch(`${API_BASE}/birthdays`);
    if (!res.ok) throw new Error('Failed to fetch birthday list');
    return res.json();
  },

  // 4. Get public birthday page details
  async getPublicBirthday(token: string): Promise<BirthdayEvent> {
    const res = await fetch(`${API_BASE}/birthdays/${token}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Birthday page not found');
    }
    return res.json();
  },

  // 5. Get admin birthday details with stats and wishes
  async getAdminBirthday(token: string, pin?: string): Promise<BirthdayEvent & { wishes: Wish[] }> {
    const url = pin ? `${API_BASE}/birthdays/${token}/admin?pin=${encodeURIComponent(pin)}` : `${API_BASE}/birthdays/${token}/admin`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Unauthorized or birthday not found');
    }
    return res.json();
  },

  // 6. Submit a wish
  async submitWish(token: string, wish: {
    senderName: string;
    message?: string;
    imageUrl?: string;
    videoUrl?: string;
    theme: string;
    deliveryMethod?: string;
  }): Promise<Wish> {
    const res = await fetch(`${API_BASE}/birthdays/${token}/wishes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wish),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit wish');
    }

    return res.json();
  },

  // 7. Get wishes for a birthday
  async getWishes(token: string): Promise<Wish[]> {
    const res = await fetch(`${API_BASE}/birthdays/${token}/wishes`);
    if (!res.ok) throw new Error('Failed to fetch wishes');
    return res.json();
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
    const res = await fetch(`${API_BASE}/birthdays/${token}/wishes/${wishId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete wish');
  }
};
