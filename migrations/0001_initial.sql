-- 0001_initial.sql: Cloudflare D1 Database Initial Schema

-- Table: birthdays
CREATE TABLE IF NOT EXISTS birthdays (
  id TEXT PRIMARY KEY,
  public_token TEXT UNIQUE NOT NULL,
  admin_pin TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_masked TEXT NOT NULL,
  email TEXT,
  photo_url TEXT,
  birthday_date TEXT,
  theme_preference TEXT DEFAULT 'gold',
  created_at TEXT NOT NULL,
  total_wishes INTEGER DEFAULT 0,
  whatsapp_shares INTEGER DEFAULT 0,
  sms_shares INTEGER DEFAULT 0,
  email_shares INTEGER DEFAULT 0,
  images_received INTEGER DEFAULT 0,
  videos_received INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_birthdays_public_token ON birthdays(public_token);
CREATE INDEX IF NOT EXISTS idx_birthdays_created_at ON birthdays(created_at);

-- Table: wishes
CREATE TABLE IF NOT EXISTS wishes (
  id TEXT PRIMARY KEY,
  birthday_token TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  theme TEXT DEFAULT 'gold',
  delivery_method TEXT DEFAULT 'whatsapp',
  created_at TEXT NOT NULL,
  FOREIGN KEY (birthday_token) REFERENCES birthdays(public_token) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wishes_birthday_token ON wishes(birthday_token);
CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON wishes(created_at);

-- Seed Default Demo Birthday (Arun Kumar)
INSERT OR IGNORE INTO birthdays (
  id,
  public_token,
  admin_pin,
  name,
  phone,
  phone_masked,
  email,
  photo_url,
  birthday_date,
  theme_preference,
  created_at,
  total_wishes,
  whatsapp_shares,
  sms_shares,
  email_shares,
  images_received,
  videos_received
) VALUES (
  'demo-bday-1',
  'arun-kumar-demo',
  '1234',
  'Arun Kumar',
  '+919876543210',
  '+91 98*** ***10',
  'arun.birthday@example.com',
  NULL,
  date('now', '+2 days'),
  'gold',
  datetime('now'),
  3,
  2,
  1,
  0,
  0,
  0
);

-- Seed Default Demo Wishes
INSERT OR IGNORE INTO wishes (
  id,
  birthday_token,
  sender_name,
  message,
  image_url,
  video_url,
  theme,
  delivery_method,
  created_at
) VALUES (
  'wish-1',
  'arun-kumar-demo',
  'Kamal',
  'Happy birthday Arun! Wishing you immense joy, great health, and tremendous success this year! Let’s celebrate soon! 🎂🎉',
  NULL,
  NULL,
  'gold',
  'whatsapp',
  datetime('now', '-4 hours')
);

INSERT OR IGNORE INTO wishes (
  id,
  birthday_token,
  sender_name,
  message,
  image_url,
  video_url,
  theme,
  delivery_method,
  created_at
) VALUES (
  'wish-2',
  'arun-kumar-demo',
  'Priya & Rahul',
  'May all your dreams turn into reality this year. Have a blast and keep smiling always! ✨❤️',
  NULL,
  NULL,
  'festive',
  'sms',
  datetime('now', '-2 hours')
);

INSERT OR IGNORE INTO wishes (
  id,
  birthday_token,
  sender_name,
  message,
  image_url,
  video_url,
  theme,
  delivery_method,
  created_at
) VALUES (
  'wish-3',
  'arun-kumar-demo',
  'Ananya',
  'Happy Birthday brother! Cheers to more late night talks and awesome adventures together! 🥳🥂',
  NULL,
  NULL,
  'neon',
  'whatsapp',
  datetime('now', '-1 hour')
);
