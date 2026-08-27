import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  Sparkles,
  User,
  Phone,
  Mail,
  Calendar,
  Camera,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { validateAndNormalizeIndianPhone } from '../../utils/phone';
import { isValidUploadFile } from '../../utils/fileValidation';
import { CardThemeId } from '../../types';
import { CardThemePicker } from '../birthday/CardThemePicker';
import { useToast } from '../common/Toast';
import { sound } from '../../utils/audio';

export const CreateBirthday: React.FC = () => {
  const [, setLocation] = useLocation();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthdayDate, setBirthdayDate] = useState('');
  const [themePreference, setThemePreference] = useState<CardThemeId>('gold');
  const [adminPin, setAdminPin] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Phone Validation State
  const phoneValidation = validateAndNormalizeIndianPhone(phone);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const file = files[0];
    if (!isValidUploadFile(file)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo must be under 5MB', 'error', 'File Size Limit');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploadingPhoto(true);
      sound.playPop();
      const res = await api.uploadMedia(file);
      setPhotoUrl(res.url);
      showToast('Profile photo added! 📸', 'success', 'Photo Attached');
    } catch (err: any) {
      if (err.message && !err.message.includes('No valid file selected')) {
        showToast(err.message || 'Failed to upload photo', 'error', 'Upload Notice');
      }
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Please enter the birthday person's name", 'error', 'Name Required');
      return;
    }

    if (!phoneValidation.isValid) {
      showToast(phoneValidation.error || 'Please enter a valid 10-digit Indian phone number', 'error', 'Phone Required');
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        showToast('Please enter a valid email address', 'error');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      sound.playCelebrationFanfare();

      const created = await api.createBirthday({
        name: name.trim(),
        phone: phoneValidation.normalized,
        email: email.trim() || undefined,
        photoUrl: photoUrl || undefined,
        birthdayDate: birthdayDate || undefined,
        themePreference,
        adminPin: adminPin.trim() || undefined,
      });

      showToast('Birthday Page Created Successfully! 🎉', 'success');
      // Save PIN in session
      if (created.adminPin) {
        sessionStorage.setItem(`admin_pin_${created.publicToken}`, created.adminPin);
      }

      // Navigate to Admin Dashboard for this event
      setLocation(`/admin/${created.publicToken}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create birthday page', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Header Wizard Title */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-celebration-pink/20 to-gold-500/20 border border-gold-400/30 text-gold-300 text-xs font-semibold shadow-lg">
          <Sparkles className="w-4 h-4 text-gold-400" />
          <span>Birthday Event Creator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Create A <span className="celebration-text-gradient">Birthday Page</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Generate an interactive birthday celebration hub with custom share link, scannable QR code, and wish collection!
        </p>
      </div>

      {/* Main Creation Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 rounded-3xl bg-dark-900/90 border border-white/10 backdrop-blur-xl shadow-2xl space-y-6"
      >
        {/* 1. Birthday Person Photo */}
        <div className="flex flex-col items-center space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            onClick={(e) => {
              (e.target as HTMLInputElement).value = '';
            }}
            accept="image/*"
            className="hidden"
          />
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gold-400/50 bg-dark-950 flex items-center justify-center shadow-xl">
              {isUploadingPhoto ? (
                <Loader2 className="w-6 h-6 animate-spin text-gold-400" />
              ) : photoUrl ? (
                <img src={photoUrl} alt="Birthday person" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl select-none">👑</span>
              )}
            </div>
            {photoUrl ? (
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="absolute -top-1 -right-1 p-1.5 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-2 rounded-full bg-celebration-pink text-white shadow-lg hover:scale-110 active:scale-95 transition"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold text-gold-300 hover:text-gold-200 transition"
          >
            {photoUrl ? 'Change Profile Photo' : '+ Upload Birthday Person Photo (Optional)'}
          </button>
        </div>

        {/* 2. Full Name Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-celebration-pink" />
            <span>Birthday Person Name</span>
            <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Arun Kumar"
            className="w-full px-4 py-3 rounded-2xl bg-dark-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-celebration-pink/50 focus:border-celebration-pink transition"
          />
        </div>

        {/* 3. Indian Phone Number Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-celebration-cyan" />
              <span>WhatsApp / Mobile Number</span>
              <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-slate-400">Default: India (+91)</span>
          </div>

          <div className="relative flex items-center">
            <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none text-slate-300 text-sm font-semibold border-r border-white/10 pr-2.5">
              <span>🇮🇳</span>
              <span>+91</span>
            </div>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full pl-24 pr-10 py-3 rounded-2xl bg-dark-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-celebration-cyan/50 focus:border-celebration-cyan transition"
            />
            {phone.trim().length > 0 && (
              <div className="absolute right-3.5">
                {phoneValidation.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
            )}
          </div>

          {phone.trim().length > 0 && (
            <div className="text-[11px] flex items-center justify-between pt-0.5">
              {phoneValidation.isValid ? (
                <span className="text-emerald-400 font-medium">
                  ✓ Normalized: {phoneValidation.formattedDisplay}
                </span>
              ) : (
                <span className="text-rose-400 font-medium">{phoneValidation.error}</span>
              )}
            </div>
          )}
        </div>

        {/* 4. Email Address Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-purple-400" />
            <span>Email Address (Optional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. arun@example.com"
            className="w-full px-4 py-3 rounded-2xl bg-dark-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition"
          />
          <p className="text-[11px] text-slate-400">
            Allows friends to deliver greetings directly to their email inbox
          </p>
        </div>

        {/* 5. Birthday Date Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gold-400" />
            <span>Birthday Date (Optional)</span>
          </label>
          <input
            type="date"
            value={birthdayDate}
            onChange={(e) => setBirthdayDate(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-dark-950 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition"
          />
          <p className="text-[11px] text-slate-400">
            Enables dynamic live countdown timer & celebratory "Today's the day!" banner
          </p>
        </div>

        {/* 6. Card Theme Selector */}
        <div className="pt-2 border-t border-white/5">
          <CardThemePicker
            selectedTheme={themePreference}
            onSelectTheme={(t) => setThemePreference(t)}
          />
        </div>

        {/* 7. Admin Passcode / PIN */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Admin PIN / Passcode (Optional)</span>
          </label>
          <input
            type="text"
            maxLength={6}
            value={adminPin}
            onChange={(e) => setAdminPin(e.target.value)}
            placeholder="e.g. 1234 (auto-generated if left blank)"
            className="w-full px-4 py-3 rounded-2xl bg-dark-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition"
          />
          <p className="text-[11px] text-slate-400">
            Keep this PIN handy to return and view received wishes & statistics anytime.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-black text-base text-white bg-gradient-to-r from-celebration-pink via-celebration-purple to-gold-500 shadow-xl shadow-celebration-pink/30 hover:shadow-celebration-pink/50 hover:scale-[1.01] active:scale-[0.98] transition cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-gold-200" />
                <span>Generate Unique Birthday Page</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
