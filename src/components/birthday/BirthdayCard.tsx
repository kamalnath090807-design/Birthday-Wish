import React, { forwardRef, useState } from 'react';
import { CardThemeId } from '../../types';
import { CARD_THEMES, generateDefaultWish } from '../../utils/cardThemes';
import { Sparkles, Heart } from 'lucide-react';

interface BirthdayCardProps {
  recipientName: string;
  senderName: string;
  message?: string;
  imageUrl?: string | null;
  theme: CardThemeId;
  date?: string;
  interactive?: boolean;
}

export const BirthdayCard = forwardRef<HTMLDivElement, BirthdayCardProps>(
  (
    {
      recipientName,
      senderName,
      message,
      imageUrl,
      theme = 'gold',
      date,
      interactive = true,
    },
    ref
  ) => {
    const themeConfig = CARD_THEMES[theme] || CARD_THEMES.gold;
    const effectiveMessage =
      message && message.trim().length > 0
        ? message.trim()
        : generateDefaultWish(recipientName, senderName || 'A Friend');

    const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!interactive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: x * 10, y: -y * 10 });
    };

    const handleMouseLeave = () => {
      if (!interactive) return;
      setTilt({ x: 0, y: 0 });
    };

    return (
      <div
        className="w-full flex items-center justify-center p-2 card-perspective"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={ref}
          style={{
            transform: interactive
              ? `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`
              : 'none',
          }}
          className={`card-3d-inner relative w-full max-w-[440px] rounded-3xl p-6 sm:p-8 transition-transform duration-150 ${themeConfig.cardBg} ${themeConfig.borderStyle} ${themeConfig.textColor} overflow-hidden`}
        >
          {/* Theme Decorative Accents / Corner Icons */}
          <div className="absolute top-4 left-4 text-xl opacity-70 select-none">
            {themeConfig.decorations[0]}
          </div>
          <div className="absolute top-4 right-4 text-xl opacity-70 select-none">
            {themeConfig.decorations[1]}
          </div>
          <div className="absolute bottom-4 left-4 text-xl opacity-70 select-none">
            {themeConfig.decorations[2]}
          </div>
          <div className="absolute bottom-4 right-4 text-xl opacity-70 select-none">
            {themeConfig.decorations[3]}
          </div>

          {/* Background subtle radial glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${themeConfig.accentColor} 0%, transparent 70%)`,
            }}
          />

          {/* Card Content */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            {/* Header Sparkle Banner */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold tracking-[0.2em] uppercase">
              <Sparkles className="w-3 h-3 text-gold-400" />
              <span>Happy Birthday</span>
              <Sparkles className="w-3 h-3 text-gold-400" />
            </div>

            {/* Recipient Name */}
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase"
              style={{ fontFamily: themeConfig.fontFamily }}
            >
              {recipientName || 'Birthday Star'} 🎂
            </h2>

            {/* Attached Photo Preview (if present) */}
            {imageUrl && (
              <div className="relative w-full max-w-[280px] p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg my-1 rotate-[-1deg] hover:rotate-0 transition-transform">
                <img
                  src={imageUrl}
                  alt="Birthday memory"
                  className="w-full h-44 sm:h-52 object-cover rounded-xl shadow-inner"
                />
              </div>
            )}

            {/* Custom / Dynamic Message */}
            <div className="w-full max-w-[360px] py-3 px-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 shadow-sm text-left">
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium opacity-95">
                "{effectiveMessage}"
              </p>
            </div>

            {/* Heart Divider */}
            <div className="flex items-center gap-2 opacity-60 my-1">
              <div className="h-px w-10 bg-current opacity-40" />
              <Heart className="w-3.5 h-3.5 fill-current text-rose-400" />
              <div className="h-px w-10 bg-current opacity-40" />
            </div>

            {/* Sender Signature */}
            <div className="space-y-0.5">
              <div className="text-[11px] uppercase tracking-widest opacity-70">
                Warmly Sent By
              </div>
              <div
                className="text-lg sm:text-xl font-bold tracking-tight"
                style={{
                  fontFamily:
                    theme === 'pastel'
                      ? 'Dancing Script, cursive'
                      : 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {senderName || 'Your Well-Wisher'} ❤️
              </div>
            </div>

            {/* Footer Celebration Emojis */}
            <div className="pt-2 text-sm sm:text-base select-none tracking-widest opacity-85">
              🎈 🎉 ✨ 🎂 ✨ 🎉 🎈
            </div>

            {date && (
              <div className="text-[10px] opacity-50 tracking-wider">
                {new Date(date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

BirthdayCard.displayName = 'BirthdayCard';
