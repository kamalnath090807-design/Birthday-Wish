import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RotateCcw, Download, PlusCircle } from 'lucide-react';
import { BirthdayEvent, CardThemeId } from '../../types';
import { triggerCelebrationConfetti } from '../common/ConfettiCanvas';
import { BirthdayCard } from './BirthdayCard';
import { sound } from '../../utils/audio';

interface SuccessCelebrationProps {
  birthday: BirthdayEvent;
  senderName: string;
  message: string;
  imageUrl: string | null;
  theme: CardThemeId;
  isBelated?: boolean;
  onWishAgain: () => void;
  onEditWish: () => void;
  onDownloadCard: () => void;
}

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  birthday,
  senderName,
  message,
  imageUrl,
  theme,
  isBelated,
  onWishAgain,
  onEditWish,
  onDownloadCard,
}) => {
  useEffect(() => {
    // Trigger celebratory confetti and fanfare sound
    triggerCelebrationConfetti();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto py-8 px-4 text-center space-y-6"
    >
      {/* Sparkle Header Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold shadow-xl shadow-emerald-500/10 animate-bounce">
        <Sparkles className="w-4 h-4 text-gold-400" />
        <span>{isBelated ? '🎉 Belated Wish Prepared & Sent! 🎉' : '🎉 Wish Prepared & Sent! 🎉'}</span>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          You made <span className="celebration-text-gradient">{birthday.name}'s</span> day brighter! ❤️
        </h2>
        <p className="text-sm text-slate-300 max-w-md mx-auto">
          Thank you, <span className="text-gold-300 font-bold">{senderName}</span>! Your heartfelt birthday wish and custom greeting card are ready to be cherished forever.
        </p>
      </div>

      {/* Generated Card Showcase */}
      <div className="py-2">
        <BirthdayCard
          recipientName={birthday.name}
          senderName={senderName}
          message={message}
          imageUrl={imageUrl}
          theme={theme}
          isBelated={isBelated}
          date={birthday.birthdayDate}
          interactive={false}
        />
      </div>

      {/* Action Buttons: Save HD Image, Wish Again, Edit This Wish */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {/* 1. Save HD Card Image */}
        <button
          onClick={() => {
            sound.playPop();
            onDownloadCard();
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-gold-500 to-amber-600 text-dark-950 shadow-lg shadow-gold-500/20 hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Save HD Card Image</span>
        </button>

        {/* 2. Wish Again (Brand new wish) */}
        <button
          onClick={() => {
            sound.playPop();
            onWishAgain();
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-celebration-pink via-celebration-purple to-gold-500 text-white shadow-lg shadow-celebration-pink/25 hover:shadow-celebration-pink/40 hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-gold-200" />
          <span>Wish Again</span>
        </button>

        {/* 3. Edit & Re-send Current Wish */}
        <button
          onClick={() => {
            sound.playPop();
            onEditWish();
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/15 text-white border border-white/15 hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-celebration-pink" />
          <span>Edit & Re-send</span>
        </button>
      </div>
    </motion.div>
  );
};
