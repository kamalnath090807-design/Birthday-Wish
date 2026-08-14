import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { api } from '../services/api';
import { BirthdayEvent, Wish } from '../types';
import { BirthdayHero } from '../components/birthday/BirthdayHero';
import { WishForm } from '../components/birthday/WishForm';
import { WishFeed } from '../components/wishes/WishFeed';
import { Sparkles, AlertCircle, PlusCircle, Heart } from 'lucide-react';
import { sound } from '../utils/audio';

export const BirthdayPage: React.FC = () => {
  const [, params] = useRoute('/birthday/:token');
  const token = params?.token || '';

  const [birthday, setBirthday] = useState<BirthdayEvent | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    Promise.all([
      api.getPublicBirthday(token),
      api.getWishes(token).catch(() => []),
    ])
      .then(([bdayData, wishData]) => {
        setBirthday(bdayData);
        setWishes(wishData);
      })
      .catch((err) => {
        setError(err.message || 'Could not find this birthday celebration page.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const scrollToForm = () => {
    const el = document.getElementById('wish-form-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-celebration-pink border-t-transparent animate-spin" />
        <div className="text-sm font-semibold text-slate-300 animate-pulse">
          Preparing Birthday Magic... ✨
        </div>
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
            {error || 'This link may have expired or been moved.'}
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            onClick={() => sound.playPop()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs bg-gradient-to-r from-celebration-pink to-gold-500 text-white shadow-lg"
          >
            <span>Explore Birthday Platform</span>
          </Link>
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

      {/* 3. Community Wish Wall */}
      {wishes.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-24 pt-8 border-t border-white/5">
          <WishFeed wishes={wishes} birthdayName={birthday.name} />
        </div>
      )}
    </div>
  );
};
