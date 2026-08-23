import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, ArrowDown, Gift, Clock, Heart } from 'lucide-react';
import { BirthdayEvent } from '../../types';
import { sound } from '../../utils/audio';
import { getBirthdayStatus, BirthdayStatus } from '../../utils/dateUtils';

interface BirthdayHeroProps {
  birthday: BirthdayEvent;
  onScrollToForm: () => void;
}

export const BirthdayHero: React.FC<BirthdayHeroProps> = ({ birthday, onScrollToForm }) => {
  const [status, setStatus] = useState<BirthdayStatus>(() =>
    getBirthdayStatus(birthday.birthdayDate)
  );

  useEffect(() => {
    const update = () => {
      setStatus(getBirthdayStatus(birthday.birthdayDate));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [birthday.birthdayDate]);

  const { isToday, isBelated, isYesterday, isUpcoming, countdown, heroBadge, greetingTitle } = status;

  return (
    <div className="relative pt-6 pb-12 sm:pb-16 text-center px-4 overflow-hidden">
      {/* Top celebratory pill */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs sm:text-sm font-medium text-gold-300 shadow-lg shadow-gold-500/10 mb-6"
      >
        <Sparkles className="w-4 h-4 text-gold-400 animate-sparkle" />
        <span>{heroBadge}</span>
      </motion.div>

      {/* Birthday Person Avatar */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
        className="relative mx-auto mb-6 w-28 h-28 sm:w-36 sm:h-36"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-celebration-pink via-gold-400 to-celebration-cyan p-1 animate-pulse-glow">
          <div className="w-full h-full rounded-full overflow-hidden bg-dark-900 border-2 border-dark-950 flex items-center justify-center">
            {birthday.photoUrl ? (
              <img
                src={birthday.photoUrl}
                alt={birthday.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-5xl sm:text-6xl select-none">👑</div>
            )}
          </div>
        </div>
        <div className="absolute -bottom-2 -right-1 text-2xl bg-dark-900 rounded-full p-1 border border-gold-500/40 shadow-md">
          🎂
        </div>
      </motion.div>

      {/* Main Birthday Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
      >
        <div className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] text-celebration-pink mb-2 flex items-center justify-center gap-2">
          <span>✨</span>
          <span>{greetingTitle}</span>
          <span>✨</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-4 text-white">
          <span className="celebration-text-gradient block uppercase">
            {birthday.name}
          </span>
        </h1>

        <p className="max-w-md sm:max-w-lg mx-auto text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-normal">
          {isBelated
            ? `It's never too late to make someone smile! Send your heartfelt belated birthday wishes, attach a photo memory, and deliver a personalized 3D card directly to WhatsApp, SMS, or Email! 💖`
            : `Let's make this birthday unforgettable. Write a personalized wish, attach a memory photo/video, generate a custom greeting card, and send it directly! ❤️`}
        </p>
      </motion.div>

      {/* Dynamic Celebration / Countdown Banner */}
      {birthday.birthdayDate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="inline-block max-w-sm w-full mb-8"
        >
          {isToday ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-celebration-pink/20 via-gold-500/20 to-celebration-cyan/20 border border-gold-400/40 backdrop-blur-md shadow-xl shadow-gold-500/10 animate-bounce">
              <div className="text-lg font-bold text-gold-200 flex items-center justify-center gap-2">
                <span>🥳</span>
                <span>Today's the Big Day!</span>
                <span>🎉</span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5">Let's shower them with love and blessings!</div>
            </div>
          ) : isYesterday ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-pink-950/40 to-dark-900 border border-celebration-pink/40 backdrop-blur-md shadow-xl">
              <div className="text-base font-bold text-pink-200 flex items-center justify-center gap-2">
                <span>💝</span>
                <span>Yesterday was their Birthday!</span>
                <span>✨</span>
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Warm wishes are always in style — send a sweet belated greeting!
              </div>
            </div>
          ) : isBelated ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-dark-900 border border-purple-400/30 backdrop-blur-md shadow-xl">
              <div className="text-base font-bold text-purple-200 flex items-center justify-center gap-2">
                <span>🎁</span>
                <span>Belated Birthday Celebration Wall</span>
                <span>✨</span>
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Cherish the memories and add your blessing to the collection!
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-dark-900/80 border border-white/10 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                <Calendar className="w-3.5 h-3.5 text-celebration-cyan" />
                <span>Birthday Countdown</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white/5 rounded-xl py-1.5 px-1 border border-white/5">
                  <div className="text-xl font-extrabold text-gold-300">{countdown.days}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Days</div>
                </div>
                <div className="bg-white/5 rounded-xl py-1.5 px-1 border border-white/5">
                  <div className="text-xl font-extrabold text-white">{countdown.hours}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Hours</div>
                </div>
                <div className="bg-white/5 rounded-xl py-1.5 px-1 border border-white/5">
                  <div className="text-xl font-extrabold text-white">{countdown.minutes}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Mins</div>
                </div>
                <div className="bg-white/5 rounded-xl py-1.5 px-1 border border-white/5">
                  <div className="text-xl font-extrabold text-celebration-pink">{countdown.seconds}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Secs</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* CTA Button to jump to Wish Form */}
      <div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            sound.playPop();
            onScrollToForm();
          }}
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm sm:text-base text-white bg-gradient-to-r from-celebration-pink via-celebration-purple to-gold-500 shadow-xl shadow-celebration-pink/30 hover:shadow-celebration-pink/50 transition-all cursor-pointer"
        >
          <Gift className="w-5 h-5 text-gold-200" />
          <span>{isBelated ? 'Send Belated Birthday Wish' : 'Send Your Birthday Wish'}</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </motion.button>
      </div>
    </div>
  );
};
