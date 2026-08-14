import React from 'react';
import { CardThemeId } from '../../types';
import { CARD_THEMES } from '../../utils/cardThemes';
import { Palette, Check } from 'lucide-react';
import { sound } from '../../utils/audio';

interface CardThemePickerProps {
  selectedTheme: CardThemeId;
  onSelectTheme: (theme: CardThemeId) => void;
}

export const CardThemePicker: React.FC<CardThemePickerProps> = ({
  selectedTheme,
  onSelectTheme,
}) => {
  const themeList = Object.values(CARD_THEMES);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-gold-400" />
          <span>Select Greeting Card Style</span>
        </label>
        <span className="text-[11px] text-gold-400/90 font-medium">
          {CARD_THEMES[selectedTheme].name}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {themeList.map((t) => {
          const isSelected = selectedTheme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                sound.playSparkle();
                onSelectTheme(t.id);
              }}
              className={`relative p-3 rounded-2xl text-left border transition-all duration-200 cursor-pointer overflow-hidden ${
                isSelected
                  ? 'border-gold-400 ring-2 ring-gold-400/30 shadow-lg shadow-gold-500/20 bg-dark-850'
                  : 'border-white/10 hover:border-white/20 bg-dark-900/60 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Mini theme preview swatch */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{t.decorations[0]}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/90">
                  {t.badge}
                </span>
              </div>

              <div className="font-bold text-xs text-white truncate">{t.name}</div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{t.description}</div>

              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gold-400 text-dark-950 flex items-center justify-center shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
