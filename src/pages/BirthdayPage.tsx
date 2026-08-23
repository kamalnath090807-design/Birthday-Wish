import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { api, onServerWakeStatus } from '../services/api';
import { BirthdayEvent } from '../types';
import { BirthdayHero } from '../components/birthday/BirthdayHero';
import { WishForm } from '../components/birthday/WishForm';
import { getBirthdayStatus } from '../utils/dateUtils';
import { AlertCircle, RotateCcw, Server, Sparkles, Clock, Heart } from 'lucide-react';
import { sound } from '../utils/audio';

export const BirthdayPage: React.FC = () => {
  const [, params] = useRoute('/birthday/:token');
  const token = params?.token || '';

  const [birthday, setBirthday] = useState<BirthdayEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWakingServer, setIsWakingServer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onServerWakeStatus((isWaking) => {
      setIsWakingServer(isWaking);
    });
    return unsubscribe;
  }, []);

  const loadData = () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    api.getPublicBirthday(token)
      .then((bdayData) => {
        setBirthday(bdayData);
      })
      .catch((err) => {
        setError(err.message || 'Could not find this birthday celebration page.');
      })
      .finally(() => {
        setIsLoading(false);
        setIsWakingServer(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const scrollToForm = () => {
    const el = document.getElementById('wish-form-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-celebration-pink border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xl">
            🎂
          </div>
        </div>

        {isWakingServer ? (
          <div className="space-y-2 max-w-sm">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs font-semibold animate-pulse">
              <Server className="w-3.5 h-3.5" />
              <span>Connecting to Server...</span>
            </div>
            <p className="text-xs text-slate-400">
              Connecting to secure service (usually takes ~10-15 seconds)...
            </p>
          </div>
        ) : (
          <div className="text-sm font-semibold text-slate-300 animate-pulse">
            Preparing Birthday Page... ✨
          </div>
        )}
      </div>
    );
  }

  if (error || !birthday) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto text-2xl shadow-xl">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Birthday Page Not Found</h2>
          <p className="text-xs text-slate-400">
            {error || 'This link may have expired or is unavailable.'}
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center">
          <button
            onClick={() => {
              sound.playPop();
              loadData();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs bg-white/10 hover:bg-white/15 text-white border border-white/15 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-celebration-cyan" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  // Check 2-day limit
  const status = getBirthdayStatus(birthday.birthdayDate, birthday.createdAt);

  if (status.isExpired) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-950/60 to-dark-900 border border-purple-500/30 flex items-center justify-center mx-auto text-4xl shadow-2xl">
          🎂
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-gold-300">
          <Clock className="w-3.5 h-3.5 text-gold-400" />
          <span>2-Day Wishing Window Concluded</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Celebration for <span className="celebration-text-gradient">{birthday.name}</span> has Ended
          </h1>
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            The 2-day wishing celebration window for {birthday.name} has concluded. Thank you to everyone who showered {birthday.name} with warm wishes and love! ❤️✨
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-dark-900/80 border border-white/10 text-slate-400 text-xs max-w-md mx-auto">
          All submitted wishes and memory cards have been safely preserved for {birthday.name}.
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* 1. Magical Atmospheric Birthday Hero */}
      <BirthdayHero birthday={birthday} onScrollToForm={scrollToForm} />

      {/* 2. Interactive Wish Creator & 3D Card Engine */}
      <WishForm birthday={birthday} />
    </div>
  );
};
