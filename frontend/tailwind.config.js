/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1D9E75',
        'primary-light': '#e6f7f2',
        'primary-dark': '#0F6E56',
        navy: '#1a1a2e',
      },
    },
  },
  plugins: [],
};
