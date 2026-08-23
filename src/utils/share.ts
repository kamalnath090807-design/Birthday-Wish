import { generateDefaultWish } from './cardThemes';

export interface ShareDataPayload {
  recipientName: string;
  recipientPhone: string; // e.g. "+919876543210"
  recipientEmail?: string;
  senderName: string;
  message?: string;
  cardUrl: string;
  isBelated?: boolean;
  imageBlob?: Blob | null;
}

/**
 * Sanitizes text for WhatsApp by removing variation selector characters (\uFE0F, \uFE0E)
 * and non-standard symbols that cause WhatsApp Web / Desktop to corrupt emojis into '???'
 */
export function cleanWhatsAppText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\uFE0E\uFE0F]/g, '') // Strip variation selectors (root cause of '???' in WhatsApp Web)
    .replace(/[\u2018\u2019]/g, "'") // Convert curly single quotes to ASCII '
    .replace(/[\u201C\u201D]/g, '"') // Convert curly double quotes to ASCII "
    .replace(/[\u2013\u2014]/g, '-') // Convert en/em dashes to ASCII -
    .replace(/[\u2500-\u257F]/g, '-'); // Convert Unicode box drawing lines to ASCII -
}

export function buildFormattedMessage(payload: ShareDataPayload): string {
  const { recipientName, senderName, message, cardUrl, isBelated } = payload;
  const rawWish = message && message.trim().length > 0
    ? message.trim()
    : generateDefaultWish(recipientName, senderName, isBelated);

  const cleanWish = cleanWhatsAppText(rawWish);
  const cleanSender = cleanWhatsAppText(senderName || 'Your Well-Wisher');
  const cleanRecipient = cleanWhatsAppText(recipientName.toUpperCase());

  const header = isBelated
    ? `*🎂 BELATED HAPPY BIRTHDAY ${cleanRecipient}! 🎂*`
    : `*🎂 HAPPY BIRTHDAY ${cleanRecipient}! 🎂*`;

  return `${header}\n\n${cleanWish}\n\n*With love & blessings,*\n*${cleanSender}* 💖\n\n------------------------------------\n*🎁 Open Your 3D Birthday Card & Memories:*\n👉 ${cardUrl}\n------------------------------------\n\n🎈 🎂 🍰 🎁 💖 🥳 🥂 ⭐`;
}

export function buildWhatsAppUrl(payload: ShareDataPayload): string {
  const { recipientPhone } = payload;
  const message = buildFormattedMessage(payload);

  // Normalize phone number to include country code (e.g. 919876543210)
  let cleanPhone = recipientPhone ? recipientPhone.replace(/[^\d]/g, '') : '';
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const encodedText = encodeURIComponent(message);

  // Use official direct WhatsApp endpoint which prevents 302 redirect charset corruption
  if (cleanPhone) {
    return `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send/?text=${encodedText}`;
}

export function buildSmsUrl(payload: ShareDataPayload): string {
  const { recipientPhone } = payload;
  const message = buildFormattedMessage(payload);
  const cleanPhone = recipientPhone.trim();
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const separator = isIOS ? '&' : '?';
  return `sms:${cleanPhone}${separator}body=${encodeURIComponent(message)}`;
}

export function buildEmailUrl(payload: ShareDataPayload): string {
  const { recipientEmail, recipientName, senderName, message, cardUrl, isBelated } = payload;
  const email = recipientEmail || '';
  const subject = isBelated
    ? `🎂 Belated Birthday Wishes Just For You, ${recipientName}! 🎁`
    : `🎂 A Special Birthday Wish For You, ${recipientName}! 🎉`;

  const wishText = message && message.trim().length > 0
    ? message.trim()
    : generateDefaultWish(recipientName, senderName, isBelated);

  const salutation = isBelated ? `Belated Happy Birthday, ${recipientName}! 🎁` : `Happy Birthday, ${recipientName}! 🎉`;

  const body = `${salutation}\n\n${wishText}\n\nWishing you happiness, good health, and an amazing year ahead!\n\nWith love,\n${senderName || 'A Friend'} 💖\n\n🎁 Your Personalized 3D Birthday Card & Memories:\n${cardUrl}`;

  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildThankYouMessage(recipientName: string, senderName: string): string {
  const cleanRecipient = cleanWhatsAppText(recipientName);
  const cleanSender = cleanWhatsAppText(senderName.toUpperCase());

  return `*💖 THANK YOU SO MUCH, ${cleanSender}! 💖*\n\n"Your lovely birthday wish and 3D card really made my day so special and memorable! Thank you so much for your warm love, blessings, and sweet gesture!" 🎉🎂\n\n*Warmest regards,*\n*${cleanRecipient}* 💖\n\n🎈 🍰 🥳 🥂 💖`;
}

export function buildThankYouWhatsAppUrl(recipientName: string, senderName: string): string {
  const message = buildThankYouMessage(recipientName, senderName);
  return `https://api.whatsapp.com/send/?text=${encodeURIComponent(message)}`;
}

export async function shareViaWebShareApi(payload: ShareDataPayload): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const title = payload.isBelated
        ? `🎂 Belated Birthday Wish for ${payload.recipientName}!`
        : `🎂 Birthday Wish for ${payload.recipientName}!`;
      
      const shareData: any = {
        title,
        text: buildFormattedMessage(payload),
        url: payload.cardUrl,
      };

      // If an image blob was provided and file sharing is supported
      if (payload.imageBlob && typeof navigator.canShare === 'function' && navigator.canShare({ files: [new File([payload.imageBlob], 'card.png', { type: 'image/png' })] })) {
        const file = new File([payload.imageBlob], `birthday-card-${payload.recipientName.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' });
        shareData.files = [file];
      }

      await navigator.share(shareData);
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
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
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

export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && (window as any).ClipboardItem) {
      const item = new (window as any).ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (err) {
    console.warn('Could not copy image to clipboard:', err);
  }
  return false;
}
