import React, { useState } from 'react';
import { Wish, CardThemeId } from '../../types';
import { CARD_THEMES } from '../../utils/cardThemes';
import { MessageCircle, MessageSquare, Mail, Trash2, Calendar, Image as ImageIcon, Video, Heart } from 'lucide-react';
import { sound } from '../../utils/audio';

interface WishCardProps {
  wish: Wish;
  onDelete?: (wishId: string) => void;
  isAdmin?: boolean;
}

export const WishCard: React.FC<WishCardProps> = ({ wish, onDelete, isAdmin }) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const themeConfig = CARD_THEMES[wish.theme as CardThemeId] || CARD_THEMES.gold;

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <>
      <div className="relative p-5 rounded-3xl bg-dark-900/80 border border-white/10 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-4 hover:border-white/20 transition group">
        {/* Header: Sender & Theme/Delivery Tag */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-celebration-pink to-gold-400 p-[1.5px] shrink-0 shadow-md">
              <div className="w-full h-full bg-dark-950 rounded-[14px] flex items-center justify-center text-base">
                ❤️
              </div>
            </div>
            <div>
              <h4 className="text-base font-bold text-white leading-snug">
                {wish.senderName}
              </h4>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(wish.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {wish.deliveryMethod === 'whatsapp' && (
              <span className="p-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400" title="Sent via WhatsApp">
                <MessageCircle className="w-3.5 h-3.5" />
              </span>
            )}
            {wish.deliveryMethod === 'sms' && (
              <span className="p-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400" title="Sent via SMS">
                <MessageSquare className="w-3.5 h-3.5" />
              </span>
            )}
            {wish.deliveryMethod === 'email' && (
              <span className="p-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400" title="Sent via Email">
                <Mail className="w-3.5 h-3.5" />
              </span>
            )}

            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
              {themeConfig.name.split(' ')[0]}
            </span>

            {isAdmin && onDelete && (
              <button
                onClick={() => {
                  sound.playPop();
                  if (confirm(`Delete wish from ${wish.senderName}?`)) {
                    onDelete(wish.id);
                  }
                }}
                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition opacity-0 group-hover:opacity-100"
                title="Delete Wish"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-dark-950/40 p-3.5 rounded-2xl border border-white/5 font-normal">
          "{wish.message}"
        </div>

        {/* Attached Photo / Video */}
        {((wish.imageUrl && !imageError) || wish.videoUrl) && (
          <div className="space-y-2 pt-1">
            {wish.imageUrl && !imageError && (
              <div
                onClick={() => setShowImageModal(true)}
                className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer group/img max-h-48"
              >
                <img
                  src={wish.imageUrl}
                  alt={`Memory from ${wish.senderName}`}
                  className="w-full h-44 object-cover group-hover/img:scale-105 transition-transform duration-300"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold text-white gap-1.5">
                  <ImageIcon className="w-4 h-4" /> Click to enlarge
                </div>
              </div>
            )}

            {wish.videoUrl && (
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black">
                <video src={wish.videoUrl} controls className="w-full max-h-48 object-cover" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox for attached image */}
      {showImageModal && wish.imageUrl && (
        <div
          onClick={() => setShowImageModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <img
              src={wish.imageUrl}
              alt="Full size memory"
              className="w-full h-full object-contain max-h-[85vh] bg-black"
            />
          </div>
        </div>
      )}
    </>
  );
};
