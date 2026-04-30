/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FF4FA3",
        secondary: "#38D6C4",
        accent: "#7CF3E6",
        dark: "#0F172A",
        "light-bg": "#F8FAFC",
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        DEFAULT: "12px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.08)",
        medium: "0 4px 16px rgba(0, 0, 0, 0.12)",
      },
    },
  },
};
