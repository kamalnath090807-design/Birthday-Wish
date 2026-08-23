import React from 'react';
import { Link, useLocation } from 'wouter';
import { Sparkles, PlusCircle, ShieldCheck, Heart } from 'lucide-react';
import { AudioToggle } from './AudioToggle';
import { sound } from '../../utils/audio';

export const Navbar: React.FC = () => {
  const [location] = useLocation();
  const isCelebrationView = location.startsWith('/birthday') || location.startsWith('/wish');

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-dark-950/75 border-b border-white/10 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        {isCelebrationView ? (
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-celebration-pink via-celebration-purple to-gold-400 p-[1.5px] shadow-lg shadow-celebration-pink/20">
              <div className="w-full h-full bg-dark-900 rounded-[14px] flex items-center justify-center text-xl">
                🎂
              </div>
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg tracking-tight flex items-center gap-1.5 text-white">
                <span>Birthday</span>
                <span className="celebration-text-gradient">Wish</span>
                <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-sparkle" />
              </div>
              <div className="text-[10px] text-slate-400 tracking-wider uppercase -mt-0.5">
                Celebration Page
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/"
            onClick={() => sound.playPop()}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-celebration-pink via-celebration-purple to-gold-400 p-[1.5px] shadow-lg shadow-celebration-pink/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-dark-900 rounded-[14px] flex items-center justify-center text-xl">
                🎂
              </div>
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg tracking-tight flex items-center gap-1.5 text-white">
                <span>Birthday</span>
                <span className="celebration-text-gradient">Magic</span>
                <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-sparkle" />
              </div>
              <div className="text-[10px] text-slate-400 tracking-wider uppercase -mt-0.5">
                Premium Wishes
              </div>
            </div>
          </Link>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <AudioToggle />

          {/* Hide Admin & Create buttons completely on public birthday/wish pages */}
          {!isCelebrationView && (
            <>
              {location.startsWith('/admin') ? (
                <Link
                  href="/"
                  onClick={() => sound.playPop()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition"
                >
                  <Heart className="w-3.5 h-3.5 text-celebration-pink" />
                  <span>Explore</span>
                </Link>
              ) : (
                <Link
                  href="/admin"
                  onClick={() => sound.playPop()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
                  <span className="hidden xs:inline">Admin Hub</span>
                </Link>
              )}

              <Link
                href="/create"
                onClick={() => sound.playPop()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-celebration-pink via-celebration-purple to-gold-500 text-white shadow-md shadow-celebration-pink/25 hover:shadow-celebration-pink/40 hover:scale-105 active:scale-95 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Page</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
