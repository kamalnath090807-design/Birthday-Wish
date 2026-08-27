import React, { useState, useEffect } from 'react';
import { Link, useRoute } from 'wouter';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { api } from '../services/api';
import { BirthdayEvent } from '../types';
import { Sparkles, PlusCircle, Calendar, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { sound } from '../utils/audio';

export const AdminPage: React.FC = () => {
  const [match, params] = useRoute('/admin/:token');
  const [birthdays, setBirthdays] = useState<BirthdayEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!match) {
      api.getAllBirthdays()
        .then(setBirthdays)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [match]);

  // If specific token route is matched, show dashboard for that birthday
  if (match && params?.token) {
    return <AdminDashboard token={params.token} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Admin Hub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-dark-900/80 border border-white/10 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-xs font-semibold text-gold-300">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
            <span>Admin & Organizer Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Birthday Events Manager</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Select a birthday event to manage its QR code, view real-time statistics, and moderate wishes.
          </p>
        </div>

        <Link
          href="/create"
          onClick={() => sound.playPop()}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-celebration-pink via-celebration-purple to-gold-500 text-white shadow-lg shadow-celebration-pink/25 hover:scale-105 active:scale-95 transition cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Birthday Page</span>
        </Link>
      </div>

      {/* Birthday Events Directory */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-celebration-pink" />
          <span>Active Birthday Pages ({birthdays.length})</span>
        </h2>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-gold-400 border-t-transparent animate-spin mx-auto" />
          </div>
        ) : birthdays.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-dark-900/40 border border-white/5 space-y-4">
            <div className="text-5xl">🎂</div>
            <h3 className="text-lg font-bold text-white">No Birthday Pages Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create your first personalized birthday celebration page in seconds and share the magic!
            </p>
            <Link
              href="/create"
              onClick={() => sound.playPop()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-celebration-pink to-gold-500 text-white shadow-lg hover:scale-105 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Birthday Page</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {birthdays.map((b) => (
              <Link
                key={b.id}
                href={`/admin/${b.publicToken}`}
                onClick={() => sound.playPop()}
                className="group p-5 rounded-3xl bg-dark-900/80 hover:bg-dark-850 border border-white/10 hover:border-gold-400/40 backdrop-blur-xl shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold-400/30 bg-dark-950 shrink-0 flex items-center justify-center">
                    {b.photoUrl ? (
                      <img
                        src={b.photoUrl}
                        alt={b.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = '<span class="text-2xl">👑</span>';
                          }
                        }}
                      />
                    ) : (
                      <span className="text-2xl">👑</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-gold-300 transition">
                      {b.name}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      {b.birthdayDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gold-400" />
                          <span>{b.birthdayDate}</span>
                        </span>
                      )}
                      <span>•</span>
                      <span className="text-celebration-pink font-semibold">
                        {b.stats?.totalWishes ?? 0} Wishes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                  <span className="text-slate-400 font-mono">/birthday/{b.publicToken}</span>
                  <span className="font-semibold text-gold-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
