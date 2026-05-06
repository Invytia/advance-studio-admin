/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff2f2f',
          dark: '#cc2020',
          light: '#ff5555',
        },
        studio: {
          black: '#000000',
          dark: '#0a0a0a',
          gray: '#111111',
          border: '#1a1a1a',
          muted: '#2a2a2a',
          text: '#ffffff',
          subtext: '#888888',
        }
      },
      fontFamily: {
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-red': 'pulseRed 2s ease-in-out infinite',
        'splash-in': 'splashIn 1.2s ease forwards',
        'splash-out': 'splashOut 0.8s ease forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,47,47,0.4)' },
          '50%': { boxShadow: '0 0 20px 8px rgba(255,47,47,0.2)' },
        },
        splashIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '40%': { opacity: 1, transform: 'scale(1.03)' },
          '70%': { opacity: 1, transform: 'scale(1.05)' },
          '100%': { opacity: 1, transform: 'scale(1.05)' },
        },
        splashOut: {
          '0%': { opacity: 1, transform: 'scale(1.05)' },
          '100%': { opacity: 0, transform: 'scale(1.08)' },
        },
      },
    },
  },
  plugins: [],
}
