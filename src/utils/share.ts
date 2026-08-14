import { generateDefaultWish } from './cardThemes';

export interface ShareDataPayload {
  recipientName: string;
  recipientPhone: string; // e.g. "+919876543210"
  recipientEmail?: string;
  senderName: string;
  message?: string;
  cardUrl: string;
}

export function buildFormattedMessage(payload: ShareDataPayload): string {
  const { recipientName, senderName, message, cardUrl } = payload;
  const wishText = message && message.trim().length > 0
    ? message.trim()
    : generateDefaultWish(recipientName, senderName);

  return `🎂 HAPPY BIRTHDAY ${recipientName.toUpperCase()}! 🎉\n\n${wishText}\n\nWith love,\n${senderName} ❤️\n\n🎁 View Your Birthday Card:\n${cardUrl}`;
}

export function buildWhatsAppUrl(payload: ShareDataPayload): string {
  const { recipientPhone } = payload;
  const message = buildFormattedMessage(payload);
  // wa.me format requires numbers only without '+' (e.g. 919876543210)
  const cleanPhone = recipientPhone.replace(/[^\d]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildSmsUrl(payload: ShareDataPayload): string {
  const { recipientPhone } = payload;
  const message = buildFormattedMessage(payload);
  // SMS URI format
  const cleanPhone = recipientPhone.trim();
  // Check if iOS device
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const separator = isIOS ? '&' : '?';
  return `sms:${cleanPhone}${separator}body=${encodeURIComponent(message)}`;
}

export function buildEmailUrl(payload: ShareDataPayload): string {
  const { recipientEmail, recipientName, senderName, message, cardUrl } = payload;
  const email = recipientEmail || '';
  const subject = `🎂 A Birthday Wish Just For You, ${recipientName}! 🎉`;
  
  const wishText = message && message.trim().length > 0
    ? message.trim()
    : generateDefaultWish(recipientName, senderName);

  const body = `Happy Birthday, ${recipientName}! 🎉\n\n${wishText}\n\nWishing you happiness, good health, and an amazing year ahead!\n\nFrom:\n${senderName} ❤️\n\n🎁 Your Personalized Birthday Card:\n${cardUrl}`;

  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function shareViaWebShareApi(payload: ShareDataPayload): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `🎂 Birthday Wish for ${payload.recipientName}!`,
        text: buildFormattedMessage(payload),
        url: payload.cardUrl,
      });
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Web Share API error:', err);
      }
    }
  }
  return false;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
