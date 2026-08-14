import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  Sparkles,
  PlusCircle,
  QrCode,
  MessageCircle,
  Camera,
  Heart,
  ArrowRight,
  ShieldCheck,
  Zap,
  Gift
} from 'lucide-react';
import { api } from '../services/api';
import { BirthdayEvent } from '../types';
import { sound } from '../utils/audio';

export const HomePage: React.FC = () => {
  const [birthdays, setBirthdays] = useState<BirthdayEvent[]>([]);

  useEffect(() => {
    api.getAllBirthdays()
      .then(setBirthdays)
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16 space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto pt-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs sm:text-sm font-semibold text-gold-300 shadow-xl shadow-gold-500/10"
        >
          <Sparkles className="w-4 h-4 text-gold-400 animate-sparkle" />
          <span>✨ Premium Interactive Birthday Experience</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1]"
        >
          Make Their Birthday <br />
          <span className="celebration-text-gradient">Truly Unforgettable.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto"
        >
          Create a personalized birthday page with one shareable link & QR code. Friends, classmates, and family can send heartfelt wishes, photos, videos, and 3D digital greeting cards directly to WhatsApp, SMS, or Email.
        </motion.p>

        {/* Primary CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
        >
          <Link
            href="/create"
            onClick={() => sound.playPop()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-black text-base text-white bg-gradient-to-r from-celebration-pink via-celebration-purple to-gold-500 shadow-2xl shadow-celebration-pink/30 hover:shadow-celebration-pink/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-gold-200" />
            <span>Create Free Birthday Page</span>
          </Link>

          <Link
            href="/birthday/arun-kumar-demo"
            onClick={() => sound.playPop()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-bold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/15 hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <Gift className="w-4 h-4 text-celebration-pink" />
            <span>Try Live Demo (Arun's Page)</span>
          </Link>
        </motion.div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-dark-900/80 border border-white/10 backdrop-blur-xl shadow-xl space-y-3 hover:border-gold-400/40 transition">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center text-xl shadow-lg">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">WhatsApp & SMS Ready</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Pre-fills normalized Indian phone numbers (+91) with personalized greetings and card links ready for single-tap review and send.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-dark-900/80 border border-white/10 backdrop-blur-xl shadow-xl space-y-3 hover:border-celebration-pink/40 transition">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-celebration-pink to-rose-500 text-white flex items-center justify-center text-xl shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">6 Luxury Card Themes</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Royal Gold, Festive Confetti, Pastel Dream, Cyber Neon, Minimal Luxe, and Starlight Galaxy with 3D tilt and HD PNG export.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-dark-900/80 border border-white/10 backdrop-blur-xl shadow-xl space-y-3 hover:border-celebration-cyan/40 transition">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white flex items-center justify-center text-xl shadow-lg">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Scannable QR Codes</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Download crisp QR codes to print on party flyers or project on screens so anyone nearby can send greetings in seconds.
          </p>
        </div>
      </div>

      {/* Active Birthdays Carousel / List */}
      {birthdays.length > 0 && (
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-celebration-pink fill-current" />
                <span>Featured Celebrations</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Explore active birthday pages and send your warm blessings
              </p>
            </div>
            <Link
              href="/admin"
              onClick={() => sound.playPop()}
              className="text-xs font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1"
            >
              <span>Admin Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {birthdays.map((b) => (
              <Link
                key={b.id}
                href={`/birthday/${b.publicToken}`}
                onClick={() => sound.playPop()}
                className="group p-5 rounded-3xl bg-dark-900/80 hover:bg-dark-850 border border-white/10 hover:border-gold-400/40 backdrop-blur-xl shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold-400/30 bg-dark-950 shrink-0 flex items-center justify-center">
                    {b.photoUrl ? (
                      <img src={b.photoUrl} alt={b.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">👑</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-gold-300 transition">
                      {b.name}
                    </h3>
                    <div className="text-xs text-celebration-pink font-semibold mt-0.5">
                      {b.stats?.totalWishes ?? 0} Wishes Received ❤️
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                  <span>Send Wish & Card</span>
                  <span className="text-gold-400 font-bold group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
