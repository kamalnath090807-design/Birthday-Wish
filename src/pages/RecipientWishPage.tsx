import React, { useState, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { BirthdayEvent, Wish, CardThemeId } from '../types';
import { BirthdayCard } from '../components/birthday/BirthdayCard';
import { getBirthdayStatus } from '../utils/dateUtils';
import { exportCardAsImage } from '../utils/cardRenderer';
import { buildThankYouMessage, buildThankYouWhatsAppUrl, copyToClipboard } from '../utils/share';
import { triggerCelebrationConfetti } from '../components/common/ConfettiCanvas';
import { useToast } from '../components/common/Toast';
import { sound } from '../utils/audio';
import {
  Sparkles,
  Heart,
  Download,
  MessageCircle,
  Copy,
  Check,
  RotateCcw,
  Share2,
  Video,
  Image as ImageIcon,
  Send,
  X,
  AlertCircle,
  PartyPopper,
} from 'lucide-react';

export const RecipientWishPage: React.FC = () => {
  const [, params] = useRoute('/wish/:wishId');
  const wishId = params?.wishId || '';
  const { showToast } = useToast();

  const [wish, setWish] = useState<Wish | null>(null);
  const [birthday, setBirthday] = useState<BirthdayEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wishId) return;

    setIsLoading(true);
    setError(null);

    api.getWishById(wishId)
      .then((data) => {
        setWish(data.wish);
        setBirthday(data.birthday);
        triggerCelebrationConfetti();
        sound.playSparkle();
      })
      .catch((err) => {
        setError(err.message || 'Birthday wish card not found.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [wishId]);

  const handleDownloadCard = async () => {
    if (!cardRef.current || !birthday) return;
    try {
      sound.playSparkle();
      await exportCardAsImage(cardRef.current, {
        fileName: `birthday-card-${birthday.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        pixelRatio: 3,
      });
      showToast('HD Card saved to your photos! 🎁', 'success');
    } catch (e) {
      showToast('Could not save card image', 'error');
    }
  };

  const handleCopyThankYou = async () => {
    if (!birthday || !wish) return;
    const text = buildThankYouMessage(birthday.name, wish.senderName);
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      sound.playPop();
      showToast('Thank you message copied! 💖', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendThankYouWhatsApp = () => {
    if (!birthday || !wish) return;
    sound.playPop();
    const url = buildThankYouWhatsAppUrl(birthday.name, wish.senderName);
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-celebration-pink border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xl">
            🎂
          </div>
        </div>
        <div className="text-sm font-semibold text-slate-300 animate-pulse">
          Opening Your 3D Birthday Wish Card... ✨
        </div>
      </div>
    );
  }

  if (error || !wish || !birthday) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto text-2xl shadow-xl">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Wish Card Not Found</h2>
          <p className="text-xs text-slate-400">
            {error || 'This wish card link may have expired or is unavailable.'}
          </p>
        </div>
      </div>
    );
  }

  const status = getBirthdayStatus(birthday.birthdayDate, wish.createdAt);

  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-12">
      {/* 1. Header Atmosphere */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-celebration-pink/20 via-celebration-purple/20 to-gold-500/20 border border-celebration-pink/30 text-gold-300 text-xs sm:text-sm font-bold shadow-xl animate-bounce">
          <Sparkles className="w-4 h-4 text-gold-400" />
          <span>
            {status.isBelated ? '🎁 A Belated Birthday Gift Just For You! 🎁' : '🎉 A Special Birthday Gift Just For You! 🎉'}
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {status.isBelated ? 'Belated Happy Birthday,' : 'Happy Birthday,'}{' '}
            <span className="celebration-text-gradient">{birthday.name}</span>! 🎂
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-medium">
            Warmly sent with love by{' '}
            <span className="text-gold-300 font-bold underline decoration-gold-400 decoration-wavy underline-offset-4">
              {wish.senderName}
            </span>{' '}
            ❤️
          </p>
        </div>
      </motion.div>

      {/* 2. Attached Photo Memory (if provided by sender) */}
      {wish.imageUrl && !imageError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-xl mx-auto mb-8"
        >
          <div className="bg-dark-900/80 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-white/10 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5 text-gold-300 font-bold">
                <ImageIcon className="w-3.5 h-3.5" /> Memory Photo from {wish.senderName}
              </span>
              <span>❤️</span>
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-video sm:aspect-square bg-dark-950 flex items-center justify-center border border-white/10">
              <img
                src={wish.imageUrl}
                alt="Birthday Memory"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. Attached Video Message (if provided by sender) */}
      {wish.videoUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-xl mx-auto space-y-3"
        >
          <div className="p-4 sm:p-6 rounded-3xl bg-dark-900/90 border border-purple-500/30 shadow-2xl backdrop-blur-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-celebration-pink px-1">
              <Video className="w-4 h-4" />
              <span>Video Greeting from {wish.senderName} 🎬</span>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black border border-white/10 aspect-video">
              <video
                src={wish.videoUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* 4. Heartfelt Personalized Message */}
      {wish.message && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="max-w-xl mx-auto"
        >
          <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-dark-900 via-dark-950 to-purple-950/40 border border-white/15 shadow-2xl text-center space-y-4">
            <div className="text-3xl text-gold-400 font-serif opacity-75">“</div>
            <p className="text-base sm:text-xl text-slate-100 font-medium leading-relaxed italic px-2">
              {wish.message}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-gold-300 font-bold uppercase tracking-wider">
              <span>— With Love, {wish.senderName} ❤️</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 5. Interactive 3D Birthday Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="max-w-xl mx-auto space-y-6 text-center"
      >
        <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span>Interactive 3D Greeting Card (Touch / Move Cursor to Tilt)</span>
        </div>

        <div ref={cardRef} className="py-2">
          <BirthdayCard
            recipientName={birthday.name}
            senderName={wish.senderName}
            message={wish.message}
            imageUrl={wish.imageUrl}
            theme={(wish.theme as CardThemeId) || 'gold'}
            isBelated={status.isBelated}
            date={birthday.birthdayDate}
            interactive={true}
          />
        </div>

        {/* Action Buttons: Save HD Image & Say Thank You */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {/* Save HD Card Button */}
          <button
            onClick={handleDownloadCard}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-gold-500 to-amber-600 text-dark-950 shadow-lg shadow-gold-500/20 hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Save HD Card to Photos</span>
          </button>

          {/* Say Thank You Button */}
          <button
            onClick={() => {
              sound.playPop();
              setIsThankYouOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-celebration-pink via-celebration-purple to-gold-500 text-white shadow-lg shadow-celebration-pink/30 hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <Heart className="w-4 h-4 text-gold-300 animate-pulse" />
            <span>Say Thank You to {wish.senderName} ❤️</span>
          </button>
        </div>
      </motion.div>

      {/* 6. Thank You Modal */}
      <AnimatePresence>
        {isThankYouOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg bg-dark-900 border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-left"
            >
              <button
                onClick={() => setIsThankYouOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-celebration-pink/20 border border-celebration-pink/40 text-celebration-pink text-xs font-bold">
                  <Heart className="w-3.5 h-3.5" />
                  <span>Send a Heartfelt Reply</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Say Thank You to {wish.senderName} 🥰
                </h3>
                <p className="text-xs text-slate-400">
                  Send a personalized thank you message with emojis and warm greetings!
                </p>
              </div>

              {/* Message Preview Box */}
              <div className="p-4 rounded-2xl bg-dark-950 border border-white/10 text-xs sm:text-sm text-slate-200 space-y-2 whitespace-pre-line leading-relaxed font-mono">
                {buildThankYouMessage(birthday.name, wish.senderName)}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleSendThankYouWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 hover:scale-[1.02] active:scale-95 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </button>

                <button
                  onClick={handleCopyThankYou}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/15 hover:scale-[1.02] active:scale-95 transition cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-celebration-cyan" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Thank You Message'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
