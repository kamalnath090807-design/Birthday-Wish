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
  phoneMasked: string; // +91 98*** ***10
  email?: string;
  photoUrl?: string;
  birthdayDate?: string;
  themePreference?: string;
  createdAt: string;
  stats?: BirthdayStats;
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

export interface PhoneValidationResult {
  isValid: boolean;
  raw: string;
  normalized: string;
  cleanDigits: string;
  countryCode: string;
  formattedDisplay: string;
  maskedDisplay: string;
  error?: string;
}

export interface Env {
  DB: D1Database;
  ASSETS?: Fetcher;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  CLOUDINARY_UPLOAD_PRESET?: string;
}
