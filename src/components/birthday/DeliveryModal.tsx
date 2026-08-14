import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  MessageSquare,
  Mail,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  ExternalLink,
  Loader2,
  Share2
} from 'lucide-react';
import { BirthdayEvent, CardThemeId } from '../../types';
import {
  buildWhatsAppUrl,
  buildSmsUrl,
  buildEmailUrl,
  copyToClipboard,
  buildFormattedMessage,
  shareViaWebShareApi
} from '../../utils/share';
import { exportCardAsImage } from '../../utils/cardRenderer';
import { useToast } from '../common/Toast';
import { sound } from '../../utils/audio';
import { api } from '../../services/api';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  birthday: BirthdayEvent;
  senderName: string;
  message: string;
  imageUrl: string | null;
  videoUrl: string | null;
  theme: CardThemeId;
  cardElementRef: React.RefObject<HTMLDivElement | null>;
  onWishCompleted: () => void;
}

export const DeliveryModal: React.FC<DeliveryModalProps> = ({
  isOpen,
  onClose,
  birthday,
  senderName,
  message,
  imageUrl,
  videoUrl,
  theme,
  cardElementRef,
  onWishCompleted,
}) => {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const cardShareUrl = `${origin}/birthday/${birthday.publicToken}`;

  const payload = {
    recipientName: birthday.name,
    recipientPhone: birthday.phone,
    recipientEmail: birthday.email,
    senderName,
    message,
    cardUrl: cardShareUrl,
  };

  const persistWishAndProceed = async (deliveryMethod: 'whatsapp' | 'sms' | 'email' | 'download' | 'copied') => {
    try {
      setIsSubmitting(true);
      await api.submitWish(birthday.publicToken, {
        senderName,
        message,
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
        theme,
        deliveryMethod,
      });
      await api.trackShare(birthday.publicToken, deliveryMethod === 'copied' || deliveryMethod === 'download' ? 'whatsapp' : deliveryMethod);
    } catch (e) {
      console.warn('Persistence notice:', e);
    } finally {
      setIsSubmitting(false);
      onWishCompleted();
    }
  };

  const handleWhatsApp = async () => {
    sound.playPop();
    const url = buildWhatsAppUrl(payload);
    window.open(url, '_blank');
    await persistWishAndProceed('whatsapp');
  };

  const handleSms = async () => {
    sound.playPop();
    const url = buildSmsUrl(payload);
    window.location.href = url;
    await persistWishAndProceed('sms');
  };

  const handleEmail = async () => {
    sound.playPop();
    const url = buildEmailUrl(payload);
    window.location.href = url;
    await persistWishAndProceed('email');
  };

  const handleDownloadCard = async () => {
    if (!cardElementRef.current) return;
    try {
      setIsExporting(true);
      sound.playSparkle();
      showToast('Generating high-resolution birthday card image...', 'info');
      await exportCardAsImage(cardElementRef.current, {
        fileName: `birthday-card-${birthday.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        pixelRatio: 3,
      });
      showToast('Card downloaded successfully! 🎁', 'success', 'Saved to Photos/Downloads');
      await persistWishAndProceed('download');
    } catch (err: any) {
      showToast('Failed to save image. You can take a screenshot or copy text.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyMessage = async () => {
    const formatted = buildFormattedMessage(payload);
    const ok = await copyToClipboard(formatted);
    if (ok) {
      sound.playPop();
      setCopied(true);
      showToast('Personalized birthday wish copied to clipboard! 📋', 'success');
      setTimeout(() => setCopied(false), 3000);
      await persistWishAndProceed('copied');
    } else {
      showToast('Could not access clipboard. Please copy manually.', 'error');
    }
  };

  const handleNativeShare = async () => {
    sound.playPop();
    const shared = await shareViaWebShareApi(payload);
    if (shared) {
      await persistWishAndProceed('whatsapp');
    } else {
      handleCopyMessage();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-lg bg-dark-900 border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto safe-area-bottom"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-celebration-pink to-gold-400 p-[2px] shadow-lg shadow-celebration-pink/20">
              <div className="w-full h-full bg-dark-950 rounded-[14px] flex items-center justify-center text-2xl">
                🎁
              </div>
            </div>
            <h3 className="text-2xl font-black text-white">Your Birthday Wish is Ready!</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
              Choose how you'd like to deliver your wish to{' '}
              <span className="text-gold-300 font-bold">{birthday.name}</span>. Everything is pre-filled for you!
            </p>
          </div>

          {/* Delivery Channels Grid */}
          <div className="space-y-3">
            {/* 1. WhatsApp Action */}
            <button
              onClick={handleWhatsApp}
              disabled={isSubmitting}
              className="w-full group flex items-center justify-between p-4 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/40 transition-all hover:scale-[1.01] active:scale-[0.98] text-left cursor-pointer shadow-lg shadow-[#25D366]/10"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md shrink-0">
                  <MessageCircle className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <div className="font-bold text-white text-base group-hover:text-[#25D366] transition-colors flex items-center gap-1.5">
                    <span>Send via WhatsApp</span>
                    <span className="text-[10px] uppercase font-extrabold bg-[#25D366]/20 text-[#25D366] px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Pre-fills message & card to <span className="font-semibold text-slate-200">{birthday.phoneMasked || birthday.phone}</span>
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
            </button>

            {/* 2. SMS Action */}
            <button
              onClick={handleSms}
              disabled={isSubmitting}
              className="w-full group flex items-center justify-between p-4 rounded-2xl bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-500/30 transition-all hover:scale-[1.01] active:scale-[0.98] text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                    Send via SMS
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Opens your phone's SMS app ready to send
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
            </button>

            {/* 3. Email Action (if email provided or general) */}
            {birthday.email && (
              <button
                onClick={handleEmail}
                disabled={isSubmitting}
                className="w-full group flex items-center justify-between p-4 rounded-2xl bg-purple-950/30 hover:bg-purple-950/50 border border-purple-500/30 transition-all hover:scale-[1.01] active:scale-[0.98] text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-base group-hover:text-purple-400 transition-colors">
                      Send via Email
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Opens email client with styled birthday wish
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
              </button>
            )}

            {/* 4. Download Card Image */}
            <button
              onClick={handleDownloadCard}
              disabled={isExporting || isSubmitting}
              className="w-full group flex items-center justify-between p-4 rounded-2xl bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 transition-all hover:scale-[1.01] active:scale-[0.98] text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gold-400 to-amber-600 text-dark-950 flex items-center justify-center shadow-md shrink-0">
                  {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                </div>
                <div>
                  <div className="font-bold text-white text-base group-hover:text-gold-300 transition-colors">
                    Download HD Birthday Card
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Save high-res image to post on WhatsApp Status/Instagram
                  </div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-gold-400" />
            </button>

            {/* 5. Mobile Native Web Share or Copy */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-celebration-pink" />
                <span>More Share Options</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Wish Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-celebration-cyan" />
                    <span>Copy Wish Text</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-[11px] text-slate-400 leading-normal">
            💡 Selecting an option opens your device's native app with the message pre-filled. Simply review and tap Send!
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
