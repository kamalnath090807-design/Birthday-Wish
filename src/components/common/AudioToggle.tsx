import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sound } from '../../utils/audio';

export const AudioToggle: React.FC = () => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  useEffect(() => {
    setIsMuted(sound.getMuted());
  }, []);

  const handleToggle = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition backdrop-blur-md text-slate-300 hover:text-white"
      title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
    >
      {isMuted ? (
        <>
          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Muted</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Sound On</span>
        </>
      )}
    </button>
  );
};
