import { CardTheme, CardThemeId, QuickPrompt } from '../types';

export const CARD_THEMES: Record<CardThemeId, CardTheme> = {
  gold: {
    id: 'gold',
    name: 'Royal Gold & Velvet',
    badge: '👑 Luxury',
    description: 'Deep obsidian luxury with shimmering gold foil accents',
    bgGradient: 'from-amber-950/40 via-dark-900 to-black',
    cardBg: 'bg-gradient-to-br from-[#1c1608] via-[#0d0e15] to-[#120f04]',
    borderStyle: 'border-2 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.2)]',
    textColor: 'text-amber-100',
    accentColor: '#f7d065',
    decorations: ['👑', '✨', '🎂', '🥂', '⭐'],
    fontFamily: 'Cinzel, serif',
  },
  festive: {
    id: 'festive',
    name: 'Festive Celebration',
    badge: '🎉 Vibrant',
    description: 'Colorful joyful bursts, floating balloons & party confetti',
    bgGradient: 'from-pink-950/40 via-dark-900 to-indigo-950/40',
    cardBg: 'bg-gradient-to-br from-[#260f2e] via-[#0d0e15] to-[#121c3b]',
    borderStyle: 'border-2 border-pink-500/40 shadow-[0_0_30px_rgba(236,72,153,0.25)]',
    textColor: 'text-pink-50',
    accentColor: '#ff2e93',
    decorations: ['🎈', '🎉', '🎁', '🥳', '✨'],
    fontFamily: 'Outfit, sans-serif',
  },
  pastel: {
    id: 'pastel',
    name: 'Pastel Dream',
    badge: '🌸 Sweet',
    description: 'Soft cotton candy tones with heartwarming playful vibes',
    bgGradient: 'from-rose-950/30 via-dark-900 to-purple-950/30',
    cardBg: 'bg-gradient-to-br from-[#2b1820] via-[#151421] to-[#1b192e]',
    borderStyle: 'border-2 border-rose-400/40 shadow-[0_0_30px_rgba(251,113,133,0.2)]',
    textColor: 'text-rose-100',
    accentColor: '#fb7185',
    decorations: ['🌸', '💖', '🍰', '🎀', '✨'],
    fontFamily: 'Dancing Script, cursive',
  },
  neon: {
    id: 'neon',
    name: 'Cyber Neon Glow',
    badge: '⚡ Electric',
    description: 'Electrifying neon violet and cyan cyber glow',
    bgGradient: 'from-cyan-950/40 via-dark-900 to-fuchsia-950/40',
    cardBg: 'bg-gradient-to-br from-[#081f24] via-[#090b14] to-[#250926]',
    borderStyle: 'border-2 border-cyan-400/50 shadow-[0_0_35px_rgba(6,182,212,0.35)]',
    textColor: 'text-cyan-100',
    accentColor: '#00f5d4',
    decorations: ['⚡', '🔮', '💫', '🚀', '✨'],
    fontFamily: 'Outfit, sans-serif',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimalist Luxe',
    badge: '💎 Clean',
    description: 'Ultra-clean Apple-inspired soft glass gradients and elegance',
    bgGradient: 'from-slate-900 via-dark-900 to-zinc-900',
    cardBg: 'bg-gradient-to-br from-[#171822] via-[#0f1017] to-[#14151f]',
    borderStyle: 'border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]',
    textColor: 'text-slate-100',
    accentColor: '#e2e8f0',
    decorations: ['✨', '🕊️', '🤍', '⭐'],
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  },
  galaxy: {
    id: 'galaxy',
    name: 'Starlight Galaxy',
    badge: '🌌 Cosmic',
    description: 'Ethereal cosmic nebula with shimmering constellations',
    bgGradient: 'from-indigo-950/50 via-dark-900 to-purple-950/50',
    cardBg: 'bg-gradient-to-br from-[#100d29] via-[#070712] to-[#1c0e2b]',
    borderStyle: 'border-2 border-indigo-500/40 shadow-[0_0_35px_rgba(99,102,241,0.3)]',
    textColor: 'text-indigo-100',
    accentColor: '#818cf8',
    decorations: ['🌌', '✨', '🪐', '💫', '🌠'],
    fontFamily: 'Outfit, sans-serif',
  },
};

export const TODAY_QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'heartfelt',
    label: 'Heartfelt & Warm',
    emoji: '❤️',
    template: (recipient) =>
      `Happy Birthday ${recipient}! May your day be as wonderful and radiant as you are. Wishing you great health, infinite happiness, and unforgettable moments ahead! ✨❤️`,
  },
  {
    id: 'funny',
    label: 'Playful & Fun',
    emoji: '🥳',
    template: (recipient) =>
      `Happy Birthday ${recipient}! Another year older, wiser, and definitely more legendary! Let’s party hard and eat way too much cake today! 🎂🎉🍻`,
  },
  {
    id: 'inspiring',
    label: 'Big Dreams & Success',
    emoji: '🚀',
    template: (recipient) =>
      `Happy Birthday ${recipient}! May this coming year bring you closer to all your biggest dreams and grand ambitions. Keep shining bright! ⭐🏆`,
  },
  {
    id: 'short',
    label: 'Short & Sweet',
    emoji: '✨',
    template: (recipient) =>
      `Wishing you the happiest of birthdays, ${recipient}! Have a truly magical and blessed year ahead! 🎂🎈`,
  },
  {
    id: 'friend',
    label: 'Friend & Buddy',
    emoji: '🤝',
    template: (recipient) =>
      `Cheers to another fabulous year around the sun, ${recipient}! So grateful to have you in my life. Here's to making epic new memories together! 🥂🎊`,
  },
];

export const BELATED_QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'belated_warm',
    label: 'Belated & Warm',
    emoji: '💝',
    template: (recipient) =>
      `Belated Happy Birthday ${recipient}! Even though this wish is a day late, my warmest prayers, love, and best wishes for you are always on time! May this year bring you boundless joy and success! 🎂✨`,
  },
  {
    id: 'belated_fun',
    label: 'Playful Belated',
    emoji: '🥳',
    template: (recipient) =>
      `Belated Happy Birthday ${recipient}! I'm just extending your birthday celebration for another day! Hope you had a blast yesterday and keep the party going all year long! 🎉🥂🍰`,
  },
  {
    id: 'belated_sweet',
    label: 'Sweet & Blessed',
    emoji: '🌸',
    template: (recipient) =>
      `Wishing you a very Happy Belated Birthday, ${recipient}! Hoping your special day yesterday was filled with love and laughter. May God bless you with health and prosperity! 💖✨`,
  },
  {
    id: 'belated_legendary',
    label: 'Better Late Than Never',
    emoji: '🚀',
    template: (recipient) =>
      `Belated Happy Birthday ${recipient}! Better late than never for someone as awesome as you! Wishing you an incredible, super successful year ahead! 🏆🌟`,
  },
  {
    id: 'belated_short',
    label: 'Short & Sincere',
    emoji: '🎈',
    template: (recipient) =>
      `Belated Happy Birthday ${recipient}! Sending you loads of love and wishing you a wonderful year ahead filled with happiness! 🎁❤️`,
  },
];

export const QUICK_PROMPTS = TODAY_QUICK_PROMPTS;

export function getQuickPrompts(isBelated: boolean): QuickPrompt[] {
  return isBelated ? BELATED_QUICK_PROMPTS : TODAY_QUICK_PROMPTS;
}

export function generateDefaultWish(recipientName: string, _senderName?: string, isBelated: boolean = false): string {
  if (isBelated) {
    return `Wishing you a very Belated Happy Birthday, ${recipientName}! 🎂🎁\n\nEven though this wish arrives a little late, my heartfelt wishes for your happiness, good health, and success are always with you. Hope you had a fabulous celebration! ❤️✨`;
  }
  return `Wishing you a very Happy Birthday, ${recipientName}! 🎂🎉\n\nMay your day be filled with immense joy, laughter, good health and unforgettable memories. Have an amazing year ahead! ❤️`;
}
