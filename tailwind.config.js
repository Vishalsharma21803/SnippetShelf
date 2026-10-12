/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#0b1018', panel: '#111927', line: '#243044',
        muted: '#8491a7', brand: '#79e2c0', mint: '#79e2c0',
      },
      boxShadow: { glow: '0 0 0 1px rgba(121,226,192,.1), 0 18px 50px rgba(0,0,0,.2)' },
    },
  },
  plugins: [],
};
