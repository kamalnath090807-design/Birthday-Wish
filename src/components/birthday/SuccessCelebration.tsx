import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, PlusCircle, RotateCcw, Download } from 'lucide-react';
import { Link } from 'wouter';
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
  onReset: () => void;
  onDownloadCard: () => void;
}

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  birthday,
  senderName,
  message,
  imageUrl,
  theme,
  onReset,
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
        <span>🎉 Wish Prepared & Sent! 🎉</span>
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
          interactive={false}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={() => {
            sound.playPop();
            onDownloadCard();
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-gold-500 to-amber-600 text-dark-950 shadow-lg shadow-gold-500/20 hover:scale-105 active:scale-95 transition"
        >
          <Download className="w-4 h-4" />
          <span>Save HD Card Image</span>
        </button>

        <button
          onClick={() => {
            sound.playPop();
            onReset();
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/15 hover:scale-105 active:scale-95 transition"
        >
          <RotateCcw className="w-4 h-4 text-celebration-pink" />
          <span>Send Another Wish</span>
        </button>
      </div>

      {/* Create your own page banner */}
      <div className="mt-8 p-5 rounded-3xl bg-gradient-to-br from-purple-950/40 via-dark-900 to-pink-950/40 border border-purple-500/30 text-left flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
            <span>🎂 Have an upcoming birthday yourself?</span>
          </div>
          <p className="text-xs text-slate-400">
            Create your personalized birthday wish page in seconds and share with your friends & family!
          </p>
        </div>
        <Link
          href="/create"
          onClick={() => sound.playPop()}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-celebration-pink to-celebration-purple shadow-md hover:scale-105 transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Create Free Page</span>
        </Link>
      </div>
    </motion.div>
  );
};
