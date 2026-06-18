/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      animation: {
        'bounce-dot': 'bounce-dot 1.4s infinite ease-in-out both',
      },
    },
  },
  plugins: [],
};
