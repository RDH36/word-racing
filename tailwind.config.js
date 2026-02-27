/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'orb-purple': '#7c3aed',
        'orb-blue': '#3b82f6',
        'gold': '#fbbf24',
        'game-dark': '#080612',
      },
      fontFamily: {
        'fredoka': ['Fredoka_One'],
        'nunito': ['Nunito_700'],
      },
    },
  },
  plugins: [],
};
