/** @type {import('tailwindcss').Config} */
module.exports = {
  content:["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
  extend: {

    animation: {
      fadeIn: "fadeIn 0.4s ease-in-out",
      slideUp: "slideUp 0.35s ease-out"
    },

    keyframes: {

      fadeIn: {
        "0%": {
          opacity: 0
        },

        "100%": {
          opacity: 1
        }
      },

      slideUp: {
        "0%": {
          opacity: 0,
          transform: "translateY(16px)"
        },

        "100%": {
          opacity: 1,
          transform: "translateY(0)"
        }
      }

    }

  }
},
  plugins:[],
};