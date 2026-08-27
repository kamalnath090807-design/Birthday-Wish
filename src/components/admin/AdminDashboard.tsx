import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { QRCodeSVG } from 'qrcode.react';
import {
  Sparkles,
  Copy,
  Check,
  Share2,
  QrCode,
  Heart,
  MessageCircle,
  MessageSquare,
  Mail,
  Camera,
  Video,
  ExternalLink,
  PlusCircle,
  Calendar,
  Lock,
  ArrowRight,
  Eye
} from 'lucide-react';
import { BirthdayEvent, Wish } from '../../types';
import { api } from '../../services/api';
import { copyToClipboard } from '../../utils/share';
import { QRCodeModal } from './QRCodeModal';
import { WishFeed } from '../wishes/WishFeed';
import { useToast } from '../common/Toast';
import { sound } from '../../utils/audio';

interface AdminDashboardProps {
  token: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token }) => {
  const [, setLocation] = useLocation();
  const { showToast } = useToast();

  const [birthday, setBirthday] = useState<BirthdayEvent | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const [pinInput, setPinInput] = useState('');
  const [isPinRequired, setIsPinRequired] = useState(false);

  const publicUrl = `${window.location.origin}/birthday/${token}`;

  const loadData = async (pin?: string) => {
    try {
      setIsLoading(true);
      const savedPin = pin || sessionStorage.getItem(`admin_pin_${token}`) || undefined;
      const data = await api.getAdminBirthday(token, savedPin);
      setBirthday(data);
      setWishes(data.wishes || []);
      setIsPinRequired(false);
    } catch (err: any) {
      if (err.message?.includes('Unauthorized') || err.message?.includes('PIN')) {
        setIsPinRequired(true);
      } else {
        showToast('Could not load birthday details', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput) return;
    try {
      sessionStorage.setItem(`admin_pin_${token}`, pinInput);
      await loadData(pinInput);
      sound.playPop();
    } catch {
      showToast('Incorrect PIN entered', 'error');
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(publicUrl);
    if (ok) {
      sound.playPop();
      setCopiedLink(true);
      showToast('Public birthday link copied! 📋', 'success');
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share && birthday) {
      try {
        await navigator.share({
          title: `🎂 Send a birthday wish to ${birthday.name}!`,
          text: `You're invited to send a personalized birthday wish & card to ${birthday.name}! 🎂🎉`,
          url: publicUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleDeleteWish = async (wishId: string) => {
    try {
      await api.deleteWish(token, wishId);
      setWishes((prev) => prev.filter((w) => w.id !== wishId));
      showToast('Wish deleted', 'info');
      // Refresh stats
      loadData();
    } catch {
      showToast('Failed to delete wish', 'error');
    }
  };

  if (isPinRequired) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-dark-900 border border-gold-400/30 flex items-center justify-center mx-auto text-2xl shadow-xl">
          🔒
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white">Admin Authentication</h2>
          <p className="text-xs text-slate-400">
            Please enter your Admin PIN to access this organizer dashboard.
          </p>
        </div>
        <form onSubmit={handleVerifyPin} className="space-y-3">
          <input
            type="password"
            autoFocus
            maxLength={8}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="Enter Admin PIN"
            className="w-full text-center px-4 py-3 rounded-2xl bg-dark-900 border border-white/15 text-white text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          />
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-celebration-pink to-gold-500 text-white shadow-lg cursor-pointer"
          >
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  if (isLoading || !birthday) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-celebration-pink border-t-transparent animate-spin" />
      </div>
    );
  }

  const stats = birthday.stats || {
    totalWishes: wishes.length,
    whatsappShares: 0,
    smsShares: 0,
    emailShares: 0,
    imagesReceived: 0,
    videosReceived: 0,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-celebration-pink/15 via-dark-900 to-gold-500/15 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-gold-400/50 bg-dark-950 shrink-0 shadow-lg">
            {birthday.photoUrl ? (
              <img
                src={birthday.photoUrl}
                alt={birthday.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-4xl">👑</div>';
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">👑</div>
            )}
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-gold-400" />
              <span>Your Birthday Page is Live & Ready! 🎉</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {birthday.name}
            </h1>
            <div className="text-xs text-slate-400 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span>📱 {birthday.phoneMasked || birthday.phone}</span>
              {birthday.email && <span>✉️ {birthday.email}</span>}
              {birthday.birthdayDate && <span>📅 {birthday.birthdayDate}</span>}
            </div>
          </div>
        </div>

        {/* Public Page Quick Test Button */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          <Link
            href={`/birthday/${birthday.publicToken}`}
            onClick={() => sound.playPop()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs bg-white/10 hover:bg-white/15 text-white border border-white/15 hover:scale-105 active:scale-95 transition"
          >
            <Eye className="w-4 h-4 text-celebration-cyan" />
            <span>Open Public Wish Page</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </div>
      </div>

      {/* Share & QR Code Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Share Link Actions */}
        <div className="md:col-span-7 p-6 rounded-3xl bg-dark-900/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-celebration-pink" />
              <span>Shareable Birthday Link</span>
            </h2>
            <p className="text-xs text-slate-400">
              Send this unique link to classmates, colleagues, friends, and family so they can write their wishes:
            </p>

            <div className="flex items-center gap-2 p-2 pl-3.5 rounded-2xl bg-dark-950 border border-white/10 text-xs">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 bg-transparent text-gold-300 font-mono focus:outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-celebration-pink to-celebration-purple text-white font-bold transition hover:scale-105 active:scale-95 cursor-pointer shadow-md"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              onClick={handleNativeShare}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-celebration-pink" />
              <span>Mobile Web Share</span>
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-xs font-bold text-gold-300 transition cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>View & Print QR</span>
            </button>
          </div>
        </div>

        {/* Mini QR Card Preview */}
        <div
          onClick={() => setIsQrModalOpen(true)}
          className="md:col-span-5 p-6 rounded-3xl bg-dark-900/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center text-center space-y-3 cursor-pointer group hover:border-gold-400/40 transition"
        >
          <div className="p-3 bg-white rounded-2xl shadow-lg border-2 border-gold-400/20 group-hover:scale-105 transition-transform">
            <QRCodeSVG
              value={publicUrl}
              size={130}
              level="M"
              imageSettings={{
                src: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2248%22 fill=%22%23ff2e93%22/><text x=%2250%%22 y=%2255%%22 font-size=%2250%22 text-anchor=%22middle%22 dominant-baseline=%22central%22>🎂</text></svg>',
                x: undefined,
                y: undefined,
                height: 28,
                width: 28,
                excavate: true,
              }}
            />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-gold-300 transition">
              Scan to Send a Birthday Wish 🎂
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Click to download high-res PNG or print flyer
            </div>
          </div>
        </div>
      </div>

      {/* Live Statistics Counters */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-gold-400" />
          <span>Real-Time Engagement Statistics</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Wishes</span>
              <Heart className="w-4 h-4 text-celebration-pink" />
            </div>
            <div className="text-2xl font-black text-white">{stats.totalWishes}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Total Wishes</div>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>WhatsApp</span>
              <MessageCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.whatsappShares}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">WhatsApp Shares</div>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>SMS</span>
              <MessageSquare className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.smsShares}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">SMS Shares</div>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Email</span>
              <Mail className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.emailShares}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Email Shares</div>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Photos</span>
              <Camera className="w-4 h-4 text-gold-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.imagesReceived}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Photos Received</div>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Videos</span>
              <Video className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.videosReceived}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Videos Received</div>
          </div>
        </div>
      </div>

      {/* Received Wishes Feed Wall */}
      <div className="pt-4 border-t border-white/10">
        <WishFeed
          wishes={wishes}
          onDeleteWish={handleDeleteWish}
          isAdmin={true}
          birthdayName={birthday.name}
        />
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        publicUrl={publicUrl}
        birthdayName={birthday.name}
      />
    </div>
  );
};
