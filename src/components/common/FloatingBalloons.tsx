import React, { useMemo } from 'react';

interface Balloon {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
  emoji: string;
}

const BALLOON_EMOJIS = ['🎈', '🎉', '✨', '💖', '⭐', '🎈', '🎁'];

export const FloatingBalloons: React.FC = () => {
  const balloons = useMemo<Balloon[]>(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.floor(Math.random() * 92) + 4,
      size: Math.floor(Math.random() * 20) + 24,
      duration: Math.floor(Math.random() * 10) + 14,
      delay: Math.random() * 12,
      color: ['#ff2e93', '#9d4edd', '#00f5d4', '#f7d065', '#ff6b35', '#38bdf8'][i % 6],
      emoji: BALLOON_EMOJIS[i % BALLOON_EMOJIS.length],
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {balloons.map((b) => (
        <div
          key={b.id}
          className="floating-balloon select-none"
          style={{
            left: `${b.left}%`,
            fontSize: `${b.size}px`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            filter: `drop-shadow(0 0 10px ${b.color}40)`,
          }}
        >
          {b.emoji}
        </div>
      ))}
      {/* Soft atmospheric background glow orbs */}
      <div
        className="glow-orb w-96 h-96 -top-20 -left-20 bg-celebration-pink/15"
        style={{ animation: 'pulseGlow 6s ease-in-out infinite' }}
      />
      <div
        className="glow-orb w-96 h-96 top-1/3 -right-24 bg-celebration-purple/20"
        style={{ animation: 'pulseGlow 8s ease-in-out infinite 2s' }}
      />
      <div
        className="glow-orb w-[500px] h-[500px] -bottom-32 left-1/3 bg-gold-500/10"
        style={{ animation: 'pulseGlow 10s ease-in-out infinite 4s' }}
      />
    </div>
  );
};
