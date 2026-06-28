import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  safelist: [
    // Restaurant gradient classes — dynamic from API, must not be purged
    'grad-olympos', 'grad-bluebay', 'grad-sanapiro',
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: '#03045e',
          900: '#023e8a',
          800: '#0077b6',
          700: '#0096c7',
          600: '#00b4d8',
          400: '#48cae4',
          300: '#90e0ef',
          200: '#ade8f4',
          100: '#caf0f8',
        },
        sand: {
          700: '#e76f51',
          500: '#f4a261',
          300: '#e9c46a',
          100: '#fdf6e3',
        },
      },
      boxShadow: {
        'ocean':    '0 4px 16px rgba(0,180,216,0.4)',
        'ocean-lg': '0 0 48px rgba(0,180,216,0.15), 0 0 96px rgba(0,180,216,0.06), 0 4px 24px rgba(0,0,0,0.3)',
        'sand':     '0 8px 32px rgba(231,111,81,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
        'sand-sm':  '0 4px 16px rgba(231,111,81,0.35)',
        'card':     '0 12px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
        'card-hover':'0 20px 48px rgba(0,0,0,0.35)',
        'dark':     '0 8px 32px rgba(0,0,0,0.3)',
        'dark-lg':  '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'btn-ocean':    'linear-gradient(135deg, #00b4d8, #0077b6)',
        'btn-sand':     'linear-gradient(135deg, #f4a261 0%, #e76f51 100%)',
        'ocean-base':   'linear-gradient(160deg, #020330 0%, #03045e 30%, #023e8a 65%, #0077b6 100%)',
        'cart-sheet':   'linear-gradient(180deg, #03275a 0%, #020a3a 100%)',
      },
      animation: {
        wave:          'wave 10s linear infinite',
        'wave-slow':   'wave 16s linear infinite reverse',
        'wave-slower': 'wave 22s linear infinite',
        float:         'float 5s ease-in-out infinite',
        'fade-in':  'fadeIn 0.45s cubic-bezier(0.22,1,0.36,1) both',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'pop-in':   'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        'emoji':    'emojiFloat 4s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-14px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        popIn: {
          '0%':   { transform: 'scale(0.75)', opacity: '0' },
          '60%':  { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        emojiFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(-2deg) scale(1)' },
          '50%':       { transform: 'translateY(-10px) rotate(2deg) scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
