import { BirthdayEvent, BirthdayStats, Wish, TemporaryMedia } from '../types.js';

interface BirthdayRow {
  id: string;
  public_token: string;
  admin_pin: string;
  name: string;
  phone: string;
  phone_masked: string;
  email: string | null;
  photo_url: string | null;
  birthday_date: string | null;
  theme_preference: string;
  created_at: string;
  total_wishes: number;
  whatsapp_shares: number;
  sms_shares: number;
  email_shares: number;
  images_received: number;
  videos_received: number;
}

interface WishRow {
  id: string;
  birthday_token: string;
  sender_name: string;
  message: string;
  image_url: string | null;
  video_url: string | null;
  theme: string;
  delivery_method: string | null;
  created_at: string;
}

interface TemporaryMediaRow {
  id: string;
  provider_asset_id: string | null;
  provider_public_id: string;
  resource_type: string;
  media_url: string;
  birthday_token: string | null;
  wish_id: string | null;
  expires_at: string;
  created_at: string;
  deleted_at: string | null;
  cleanup_status: string;
  error_message: string | null;
}

function mapBirthdayRow(row: BirthdayRow): BirthdayEvent {
  const stats: BirthdayStats = {
    totalWishes: Number(row.total_wishes || 0),
    whatsappShares: Number(row.whatsapp_shares || 0),
    smsShares: Number(row.sms_shares || 0),
    emailShares: Number(row.email_shares || 0),
    imagesReceived: Number(row.images_received || 0),
    videosReceived: Number(row.videos_received || 0),
  };

  return {
    id: row.id,
    publicToken: row.public_token,
    adminPin: row.admin_pin,
    name: row.name,
    phone: row.phone,
    phoneMasked: row.phone_masked,
    email: row.email || undefined,
    photoUrl: row.photo_url || undefined,
    birthdayDate: row.birthday_date || undefined,
    themePreference: row.theme_preference || 'gold',
    createdAt: row.created_at,
    stats,
  };
}

function mapWishRow(row: WishRow): Wish {
  return {
    id: row.id,
    birthdayToken: row.birthday_token,
    senderName: row.sender_name,
    message: row.message,
    imageUrl: row.image_url || undefined,
    videoUrl: row.video_url || undefined,
    theme: row.theme || 'gold',
    deliveryMethod: (row.delivery_method as Wish['deliveryMethod']) || 'whatsapp',
    createdAt: row.created_at,
  };
}

function mapTemporaryMediaRow(row: TemporaryMediaRow): TemporaryMedia {
  return {
    id: row.id,
    providerAssetId: row.provider_asset_id || undefined,
    providerPublicId: row.provider_public_id,
    resourceType: (row.resource_type as 'image' | 'video') || 'image',
    mediaUrl: row.media_url,
    birthdayToken: row.birthday_token || undefined,
    wishId: row.wish_id || undefined,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    deletedAt: row.deleted_at || undefined,
    cleanupStatus: (row.cleanup_status as TemporaryMedia['cleanupStatus']) || 'pending',
    errorMessage: row.error_message || undefined,
  };
}

export const d1 = {
  async getBirthdayByToken(db: D1Database, token: string): Promise<BirthdayEvent | null> {
    const row = await db
      .prepare('SELECT * FROM birthdays WHERE public_token = ? LIMIT 1')
      .bind(token)
      .first<BirthdayRow>();

    return row ? mapBirthdayRow(row) : null;
  },

  async getBirthdayById(db: D1Database, id: string): Promise<BirthdayEvent | null> {
    const row = await db
      .prepare('SELECT * FROM birthdays WHERE id = ? LIMIT 1')
      .bind(id)
      .first<BirthdayRow>();

    return row ? mapBirthdayRow(row) : null;
  },

  async getAllBirthdays(db: D1Database): Promise<BirthdayEvent[]> {
    const { results } = await db
      .prepare('SELECT * FROM birthdays ORDER BY created_at DESC')
      .all<BirthdayRow>();

    return (results || []).map(mapBirthdayRow);
  },

  async createBirthday(db: D1Database, event: BirthdayEvent): Promise<BirthdayEvent> {
    await db
      .prepare(
        `INSERT INTO birthdays (
          id, public_token, admin_pin, name, phone, phone_masked,
          email, photo_url, birthday_date, theme_preference, created_at,
          total_wishes, whatsapp_shares, sms_shares, email_shares,
          images_received, videos_received
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        event.id,
        event.publicToken,
        event.adminPin,
        event.name,
        event.phone,
        event.phoneMasked,
        event.email || null,
        event.photoUrl || null,
        event.birthdayDate || null,
        event.themePreference || 'gold',
        event.createdAt,
        event.stats?.totalWishes || 0,
        event.stats?.whatsappShares || 0,
        event.stats?.smsShares || 0,
        event.stats?.emailShares || 0,
        event.stats?.imagesReceived || 0,
        event.stats?.videosReceived || 0
      )
      .run();

    // Link temporary media to birthday token if photo_url was uploaded
    if (event.photoUrl) {
      await db
        .prepare('UPDATE temporary_media SET birthday_token = ? WHERE media_url = ?')
        .bind(event.publicToken, event.photoUrl)
        .run()
        .catch(() => {});
    }

    return event;
  },

  async addWish(db: D1Database, token: string, wish: Wish): Promise<Wish> {
    const isImage = wish.imageUrl ? 1 : 0;
    const isVideo = wish.videoUrl ? 1 : 0;
    const isWhatsapp = wish.deliveryMethod === 'whatsapp' ? 1 : 0;
    const isSms = wish.deliveryMethod === 'sms' ? 1 : 0;
    const isEmail = wish.deliveryMethod === 'email' ? 1 : 0;

    const insertWishStmt = db
      .prepare(
        `INSERT INTO wishes (
          id, birthday_token, sender_name, message, image_url, video_url,
          theme, delivery_method, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        wish.id,
        wish.birthdayToken,
        wish.senderName,
        wish.message,
        wish.imageUrl || null,
        wish.videoUrl || null,
        wish.theme || 'gold',
        wish.deliveryMethod || 'whatsapp',
        wish.createdAt
      );

    const updateBirthdayStmt = db
      .prepare(
        `UPDATE birthdays SET
          total_wishes = total_wishes + 1,
          images_received = images_received + ?,
          videos_received = videos_received + ?,
          whatsapp_shares = whatsapp_shares + ?,
          sms_shares = sms_shares + ?,
          email_shares = email_shares + ?
        WHERE public_token = ?`
      )
      .bind(isImage, isVideo, isWhatsapp, isSms, isEmail, token);

    await db.batch([insertWishStmt, updateBirthdayStmt]);

    // Link temporary media to wish id
    if (wish.imageUrl) {
      await db
        .prepare('UPDATE temporary_media SET wish_id = ?, birthday_token = ? WHERE media_url = ?')
        .bind(wish.id, token, wish.imageUrl)
        .run()
        .catch(() => {});
    }
    if (wish.videoUrl) {
      await db
        .prepare('UPDATE temporary_media SET wish_id = ?, birthday_token = ? WHERE media_url = ?')
        .bind(wish.id, token, wish.videoUrl)
        .run()
        .catch(() => {});
    }

    return wish;
  },

  async getWishesByToken(db: D1Database, token: string): Promise<Wish[]> {
    const { results } = await db
      .prepare('SELECT * FROM wishes WHERE birthday_token = ? ORDER BY created_at DESC')
      .bind(token)
      .all<WishRow>();

    return (results || []).map(mapWishRow);
  },

  async trackShare(db: D1Database, token: string, method: 'whatsapp' | 'sms' | 'email'): Promise<void> {
    let col = 'whatsapp_shares';
    if (method === 'sms') col = 'sms_shares';
    if (method === 'email') col = 'email_shares';

    await db
      .prepare(`UPDATE birthdays SET ${col} = ${col} + 1 WHERE public_token = ?`)
      .bind(token)
      .run();
  },

  async deleteWish(db: D1Database, token: string, wishId: string): Promise<boolean> {
    const deleteStmt = db
      .prepare('DELETE FROM wishes WHERE id = ? AND birthday_token = ?')
      .bind(wishId, token);

    const updateStmt = db
      .prepare('UPDATE birthdays SET total_wishes = MAX(0, total_wishes - 1) WHERE public_token = ?')
      .bind(token);

    const [deleteRes] = await db.batch([deleteStmt, updateStmt]);
    return (deleteRes.meta.changes || 0) > 0;
  },

  async getWishById(
    db: D1Database,
    wishId: string
  ): Promise<{ wish: Wish; birthday: BirthdayEvent } | null> {
    const wishRow = await db
      .prepare('SELECT * FROM wishes WHERE id = ? LIMIT 1')
      .bind(wishId)
      .first<WishRow>();

    if (!wishRow) return null;

    const wish = mapWishRow(wishRow);
    const birthday = await this.getBirthdayByToken(db, wish.birthdayToken);

    if (!birthday) return null;

    return { wish, birthday };
  },

  // --- Temporary Media 72-Hour Tracking & Automated Cleanup ---

  async addTemporaryMedia(db: D1Database, media: TemporaryMedia): Promise<TemporaryMedia> {
    await db
      .prepare(
        `INSERT INTO temporary_media (
          id, provider_asset_id, provider_public_id, resource_type,
          media_url, birthday_token, wish_id, expires_at, created_at,
          cleanup_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        media.id,
        media.providerAssetId || null,
        media.providerPublicId,
        media.resourceType,
        media.mediaUrl,
        media.birthdayToken || null,
        media.wishId || null,
        media.expiresAt,
        media.createdAt,
        media.cleanupStatus || 'pending'
      )
      .run();

    return media;
  },

  async getExpiredMedia(db: D1Database, cutoffIso: string): Promise<TemporaryMedia[]> {
    const { results } = await db
      .prepare(
        `SELECT * FROM temporary_media
         WHERE expires_at <= ?
           AND deleted_at IS NULL
           AND cleanup_status != 'deleted'
         ORDER BY expires_at ASC
         LIMIT 50`
      )
      .bind(cutoffIso)
      .all<TemporaryMediaRow>();

    return (results || []).map(mapTemporaryMediaRow);
  },

  async markMediaDeleted(db: D1Database, id: string, deletedAt: string): Promise<void> {
    await db
      .prepare(
        `UPDATE temporary_media
         SET deleted_at = ?, cleanup_status = 'deleted', error_message = NULL
         WHERE id = ?`
      )
      .bind(deletedAt, id)
      .run();
  },

  async markMediaFailed(db: D1Database, id: string, error: string): Promise<void> {
    await db
      .prepare(
        `UPDATE temporary_media
         SET cleanup_status = 'failed', error_message = ?
         WHERE id = ?`
      )
      .bind(error, id)
      .run();
  },

  async clearMediaUrlReferences(db: D1Database, mediaUrl: string): Promise<void> {
    const clearBirthdayStmt = db
      .prepare('UPDATE birthdays SET photo_url = NULL WHERE photo_url = ?')
      .bind(mediaUrl);

    const clearWishImageStmt = db
      .prepare('UPDATE wishes SET image_url = NULL WHERE image_url = ?')
      .bind(mediaUrl);

    const clearWishVideoStmt = db
      .prepare('UPDATE wishes SET video_url = NULL WHERE video_url = ?')
      .bind(mediaUrl);

    await db.batch([clearBirthdayStmt, clearWishImageStmt, clearWishVideoStmt]);
  },
};
