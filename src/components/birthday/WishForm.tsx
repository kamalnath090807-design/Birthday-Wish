import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Wand2, Heart, User, MessageSquare } from 'lucide-react';
import { BirthdayEvent, CardThemeId } from '../../types';
import { QUICK_PROMPTS } from '../../utils/cardThemes';
import { MediaUploader } from './MediaUploader';
import { CardThemePicker } from './CardThemePicker';
import { BirthdayCard } from './BirthdayCard';
import { DeliveryModal } from './DeliveryModal';
import { SuccessCelebration } from './SuccessCelebration';
import { useToast } from '../common/Toast';
import { sound } from '../../utils/audio';
import { exportCardAsImage } from '../../utils/cardRenderer';

interface WishFormProps {
  birthday: BirthdayEvent;
}

export const WishForm: React.FC<WishFormProps> = ({ birthday }) => {
  const { showToast } = useToast();

  const [senderName, setSenderName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<CardThemeId>(
    (birthday.themePreference as CardThemeId) || 'gold'
  );

  const [isDeliveryOpen, setIsDeliveryOpen] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const handleQuickPrompt = (promptId: string) => {
    const prompt = QUICK_PROMPTS.find((p) => p.id === promptId);
    if (prompt) {
      sound.playSparkle();
      const generated = prompt.template(
        birthday.name,
        senderName.trim() || 'A Friend'
      );
      setMessage(generated);
      showToast(`Applied ${prompt.label} message! ✨`, 'info');
    }
  };

  const handleOpenDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || senderName.trim().length === 0) {
      showToast('Please enter your name so they know who sent it! ❤️', 'error', 'Name Required');
      return;
    }
    sound.playPop();
    setIsDeliveryOpen(true);
  };

  const handleResetForm = () => {
    setSenderName('');
    setMessage('');
    setImageUrl(null);
    setVideoUrl(null);
    setTheme((birthday.themePreference as CardThemeId) || 'gold');
    setIsCompleted(false);
    setIsDeliveryOpen(false);
  };

  const handleDownloadDirectCard = async () => {
    if (!cardRef.current) return;
    try {
      sound.playSparkle();
      await exportCardAsImage(cardRef.current, {
        fileName: `birthday-card-${birthday.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        pixelRatio: 3,
      });
      showToast('Card image saved successfully! 🎁', 'success');
    } catch (e) {
      showToast('Failed to download card image', 'error');
    }
  };

  if (isCompleted) {
    return (
      <SuccessCelebration
        birthday={birthday}
        senderName={senderName}
        message={message}
        imageUrl={imageUrl}
        theme={theme}
        onReset={handleResetForm}
        onDownloadCard={handleDownloadDirectCard}
      />
    );
  }

  return (
    <div id="wish-form-section" className="max-w-4xl mx-auto px-4 pb-20">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2">
          <span>Make Your Wish For</span>
          <span className="celebration-text-gradient">{birthday.name}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Customize your greeting card, attach a memory, and deliver it via WhatsApp, SMS, or Email!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-6 space-y-6">
          <form
            onSubmit={handleOpenDelivery}
            className="p-5 sm:p-7 rounded-3xl bg-dark-900/80 border border-white/10 backdrop-blur-xl shadow-2xl space-y-5"
          >
            {/* 1. Sender Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-celebration-pink" />
                  <span>Your Name</span>
                  <span className="text-rose-400">*</span>
                </span>
                <span className="text-[11px] text-slate-400">Required</span>
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Kamal"
                className="w-full px-4 py-3 rounded-2xl bg-dark-950/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-celebration-pink/50 focus:border-celebration-pink transition"
              />
            </div>

            {/* 2. Message Input with 0/500 count */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-celebration-cyan" />
                  <span>Birthday Message (Optional)</span>
                </label>
                <span
                  className={`text-[11px] font-medium ${
                    message.length > 480 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {message.length} / 500
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write something special from your heart... ❤️ (or leave empty for a warm personalized greeting)"
                className="w-full px-4 py-3 rounded-2xl bg-dark-950/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-celebration-cyan/50 focus:border-celebration-cyan transition resize-none leading-relaxed"
              />
            </div>

            {/* 3. Magic Prompt Inspirers */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gold-400">
                <Wand2 className="w-3.5 h-3.5" />
                <span>Magic Message Inspirations:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleQuickPrompt(p.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                  >
                    <span>{p.emoji}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Media Uploader */}
            <div className="pt-2 border-t border-white/5">
              <MediaUploader
                imageUrl={imageUrl}
                videoUrl={videoUrl}
                onImageUploaded={(url) => setImageUrl(url)}
                onVideoUploaded={(url) => setVideoUrl(url)}
              />
            </div>

            {/* 5. Theme Picker */}
            <div className="pt-2 border-t border-white/5">
              <CardThemePicker
                selectedTheme={theme}
                onSelectTheme={(t) => setTheme(t)}
              />
            </div>

            {/* Submit CTA */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full group flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-black text-base text-white bg-gradient-to-r from-celebration-pink via-celebration-purple to-gold-500 shadow-xl shadow-celebration-pink/30 hover:shadow-celebration-pink/50 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-gold-200 group-hover:rotate-12 transition-transform" />
                <span>Preview & Send Birthday Wish</span>
                <Send className="w-4 h-4 ml-1" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Interactive Card Preview */}
        <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>Live Card Preview</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Interactive 3D on hover/touch
            </span>
          </div>

          {/* Live Card Container */}
          <div className="p-4 rounded-3xl bg-dark-900/60 border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-center">
            <BirthdayCard
              ref={cardRef}
              recipientName={birthday.name}
              senderName={senderName}
              message={message}
              imageUrl={imageUrl}
              theme={theme}
              date={birthday.birthdayDate}
              interactive={true}
            />
          </div>

          <div className="text-center text-xs text-slate-400 px-4">
            ✨ Once ready, click <span className="text-gold-300 font-semibold">Preview & Send</span> to choose WhatsApp, SMS, Email, or download the image!
          </div>
        </div>
      </div>

      {/* Delivery Launcher Modal */}
      <DeliveryModal
        isOpen={isDeliveryOpen}
        onClose={() => setIsDeliveryOpen(false)}
        birthday={birthday}
        senderName={senderName}
        message={message}
        imageUrl={imageUrl}
        videoUrl={videoUrl}
        theme={theme}
        cardElementRef={cardRef}
        onWishCompleted={() => {
          setIsDeliveryOpen(false);
          setIsCompleted(true);
        }}
      />
    </div>
  );
};
