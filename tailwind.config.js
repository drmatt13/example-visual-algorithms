/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        "cart-bounce": "cart-bounce 7s linear infinite",
        "fade-in-slow": "fade-in .5s ease-in forwards",
        "fade-in": "fade-in .2s ease-in forwards",
        "fade-in-fast": "fade-in .1s ease-in forwards",
        "spin-slow": "spin 5s linear infinite",
        "wiggle-slow": "wiggle 2s linear infinite",
        wiggle: "wiggle 1s linear infinite",
        "wiggle-fast": "wiggle .5s linear infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      keyframes: {
        "cart-bounce": {
          "0%, 90%, 95%, 100%": { transform: "translate(0.5rem, -0.375rem)" },
          "92.5%, 97.5%": { transform: "translate(0.5rem, -0.65625rem)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
    },
  },
  plugins: [],
};
