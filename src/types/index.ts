export type CardThemeId = 'gold' | 'festive' | 'pastel' | 'neon' | 'minimal' | 'galaxy';

export interface CardTheme {
  id: CardThemeId;
  name: string;
  badge: string;
  description: string;
  bgGradient: string;
  cardBg: string;
  borderStyle: string;
  textColor: string;
  accentColor: string;
  decorations: string[];
  fontFamily: string;
}

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
  adminPin?: string;
  name: string;
  phone: string; // normalized
  phoneMasked: string;
  email?: string;
  photoUrl?: string;
  birthdayDate?: string;
  themePreference?: CardThemeId;
  createdAt: string;
  totalWishes?: number;
  stats?: BirthdayStats;
}

export interface Wish {
  id: string;
  birthdayToken: string;
  senderName: string;
  message: string;
  imageUrl?: string;
  videoUrl?: string;
  theme: CardThemeId;
  deliveryMethod?: 'whatsapp' | 'sms' | 'email' | 'download' | 'copied';
  createdAt: string;
}

export interface QuickPrompt {
  id: string;
  label: string;
  emoji: string;
  template: (recipient: string, sender: string) => string;
}
