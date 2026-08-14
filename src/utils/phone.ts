export interface PhoneValidationResult {
  isValid: boolean;
  raw: string;
  normalized: string; // e.g. "+919876543210"
  cleanDigits: string; // e.g. "9876543210"
  countryCode: string; // "+91"
  formattedDisplay: string; // e.g. "+91 98765 43210"
  maskedDisplay: string; // e.g. "+91 98*** **210"
  error?: string;
}

export function validateAndNormalizeIndianPhone(input: string | undefined | null): PhoneValidationResult {
  if (!input || typeof input !== 'string' || input.trim() === '') {
    return {
      isValid: false,
      raw: input || '',
      normalized: '',
      cleanDigits: '',
      countryCode: '+91',
      formattedDisplay: '',
      maskedDisplay: '',
      error: 'Phone number is required for WhatsApp & SMS delivery',
    };
  }

  const raw = input.trim();
  let cleaned = raw.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }

  if (cleaned.length !== 10) {
    return {
      isValid: false,
      raw,
      normalized: '',
      cleanDigits: cleaned,
      countryCode: '+91',
      formattedDisplay: '',
      maskedDisplay: '',
      error: `Invalid length (${cleaned.length}/10 digits). Please enter 10 digits.`,
    };
  }

  const firstDigit = cleaned.charAt(0);
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return {
      isValid: false,
      raw,
      normalized: '',
      cleanDigits: cleaned,
      countryCode: '+91',
      formattedDisplay: '',
      maskedDisplay: '',
      error: `Indian mobile numbers must start with 6, 7, 8, or 9 (starts with '${firstDigit}').`,
    };
  }

  const normalized = `+91${cleaned}`;
  const formattedDisplay = `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  const maskedDisplay = `+91 ${cleaned.slice(0, 2)}*** ***${cleaned.slice(8)}`;

  return {
    isValid: true,
    raw,
    normalized,
    cleanDigits: cleaned,
    countryCode: '+91',
    formattedDisplay,
    maskedDisplay,
  };
}
