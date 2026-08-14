import React, { useState } from 'react';
import { Wish } from '../../types';
import { WishCard } from './WishCard';
import { Sparkles, Heart, Search } from 'lucide-react';

interface WishFeedProps {
  wishes: Wish[];
  onDeleteWish?: (wishId: string) => void;
  isAdmin?: boolean;
  birthdayName: string;
}

export const WishFeed: React.FC<WishFeedProps> = ({
  wishes,
  onDeleteWish,
  isAdmin,
  birthdayName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWishes = wishes.filter((w) => {
    const q = searchTerm.toLowerCase();
    return (
      w.senderName.toLowerCase().includes(q) ||
      w.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-celebration-pink fill-current" />
            <span>Wishes Received ({wishes.length})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Heartfelt blessings and birthday cards shared for {birthdayName}
          </p>
        </div>

        {wishes.length > 3 && (
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by sender or message..."
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-dark-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-celebration-pink/50"
            />
          </div>
        )}
      </div>

      {filteredWishes.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-dark-900/40 border border-white/5 space-y-2">
          <div className="text-4xl">💌</div>
          <div className="text-base font-bold text-white">No wishes yet!</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Share your unique birthday link or QR code with friends and family to start collecting beautiful birthday wishes!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWishes.map((wish) => (
            <WishCard
              key={wish.id}
              wish={wish}
              onDelete={onDeleteWish}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
};
