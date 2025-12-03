/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },

  // IMPORTANT FIX FOR OLD BROWSERS (Chrome 49–80)
  future: {
    disableColorOpacityUtilitiesByDefault: true,
  },
  experimental: {
    optimizeUniversalDefaults: true,
  },
}
