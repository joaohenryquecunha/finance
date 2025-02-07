/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#121212',
          secondary: '#1E1E1E',
          tertiary: '#2D2D2D',
        },
        gold: {
          primary: '#FFD700',
          secondary: '#DAA520',
          hover: '#F4C430',
        },
      },
      boxShadow: {
        'gold-sm': '0 1px 2px 0 rgba(255, 215, 0, 0.05)',
        'gold-md': '0 4px 6px -1px rgba(255, 215, 0, 0.1), 0 2px 4px -1px rgba(255, 215, 0, 0.06)',
        'gold-lg': '0 10px 15px -3px rgba(255, 215, 0, 0.1), 0 4px 6px -2px rgba(255, 215, 0, 0.05)',
      },
    },
  },
  plugins: [],
};