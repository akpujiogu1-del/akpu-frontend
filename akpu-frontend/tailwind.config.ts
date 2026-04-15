import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2d6a2d",
          light: "#4a9e4a",
          dark: "#1a4a1a",
          50: "#eaf5ea",
          100: "#c8e6c9",
        },
        secondary: {
          DEFAULT: "#6b3a1f",
          light: "#a0622a",
          dark: "#4a2510",
          50: "#f8f0e8",
          100: "#f3e0cc",
        },
        accent: "#f5f0eb",
      },
      fontFamily: {
        sans: ["Outfit", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        marquee: "marquee 35s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(100vw)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;