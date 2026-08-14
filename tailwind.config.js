/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fffdf5',
          100: '#fef9e7',
          200: '#fdf0c5',
          300: '#fae39a',
          400: '#f7d065',
          500: '#f3b72c',
          600: '#d99718',
          700: '#b47312',
          800: '#915914',
          900: '#774814',
        },
        celebration: {
          pink: '#ff2e93',
          purple: '#9d4edd',
          indigo: '#5a189a',
          cyan: '#00f5d4',
          yellow: '#fee440',
          orange: '#ff6b35',
        },
        dark: {
          950: '#07070b',
          900: '#0d0e15',
          850: '#13141f',
          800: '#1a1c2b',
          700: '#26293f',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Cinzel', 'Playfair Display', 'serif'],
        display: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
        handwriting: ['Caveat', 'Dancing Script', 'cursive'],
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-medium': 'float 4s ease-in-out infinite',
        'float-fast': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'sparkle': 'sparkle 1.8s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'balloon-rise': 'balloonRise 12s linear infinite',
        'tilt': 'tilt 10s infinite linear',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(2deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1.2) rotate(180deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        balloonRise: {
          '0%': { transform: 'translateY(100vh) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.8' },
          '90%': { opacity: '0.8' },
          '100%': { transform: 'translateY(-20vh) rotate(15deg)', opacity: '0' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'luxury-gold': 'linear-gradient(135deg, #f7d065 0%, #f3b72c 50%, #b47312 100%)',
        'neon-glow': 'linear-gradient(135deg, #ff2e93 0%, #9d4edd 50%, #00f5d4 100%)',
        'cyber-dark': 'linear-gradient(180deg, #07070b 0%, #13141f 100%)',
      }
    },
  },
  plugins: [],
}
