import confetti from 'canvas-confetti';
import { sound } from '../../utils/audio';

export function triggerCelebrationConfetti() {
  sound.playCelebrationFanfare();

  // Burst 1: Center blast
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#f7d065', '#ff2e93', '#9d4edd', '#00f5d4', '#fee440', '#ffffff'],
    ticks: 300,
    zIndex: 9999,
  });

  // Burst 2: Left cannon
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#f7d065', '#ff2e93', '#38bdf8', '#fee440'],
      zIndex: 9999,
    });
  }, 250);

  // Burst 3: Right cannon
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#f7d065', '#9d4edd', '#00f5d4', '#fb7185'],
      zIndex: 9999,
    });
  }, 400);
}
