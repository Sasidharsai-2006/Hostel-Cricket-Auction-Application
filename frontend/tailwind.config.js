/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cricket: {
          bg: '#090D16',
          card: '#111827',
          cardLight: '#1F2937',
          border: '#374151',
          gold: '#F59E0B',
          goldLight: '#FCD34D',
          goldDark: '#B45309',
          green: '#10B981',
          red: '#EF4444',
          cyan: '#06B6D4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Oswald', 'Impact', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 25px rgba(245, 158, 11, 0.35)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.35)',
        'glow-green': '0 0 25px rgba(16, 185, 129, 0.35)',
        'glow-red': '0 0 25px rgba(239, 68, 68, 0.35)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 1.5s infinite',
      }
    },
  },
  plugins: [],
}
