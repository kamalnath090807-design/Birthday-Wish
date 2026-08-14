/**
 * Indian Mobile Number Validator and Normalizer
 * Handles all variations: +91, 0, 91 prefix, spaces, hyphens, parentheses
 * Validates 10-digit Indian mobile numbers starting with 6, 7, 8, 9
 */

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
      error: 'Phone number is required for WhatsApp/SMS delivery',
    };
  }

  const raw = input.trim();
  // Strip all non-digit characters except leading plus
  let cleaned = raw.replace(/[^\d+]/g, '');

  // Remove leading + or 00
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // Remove leading 0 if 11 digits (e.g. 09876543210)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Remove country code 91 if 12 digits (e.g. 919876543210)
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }

  // At this point, cleaned should be exactly 10 digits
  if (cleaned.length !== 10) {
    return {
      isValid: false,
      raw,
      normalized: '',
      cleanDigits: cleaned,
      countryCode: '+91',
      formattedDisplay: '',
      maskedDisplay: '',
      error: `Invalid length (${cleaned.length} digits). Indian mobile numbers must be 10 digits.`,
    };
  }

  // Check if first digit is 6, 7, 8, or 9 (standard Indian mobile allocation)
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
      error: `Indian mobile numbers must start with 6, 7, 8, or 9 (got '${firstDigit}').`,
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
