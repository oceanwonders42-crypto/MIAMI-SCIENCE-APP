import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fdf8ed",
          100: "#f9ecd0",
          200: "#f2d9a2",
          300: "#e9c06b",
          400: "#d4a853",
          500: "#c4943a",
          600: "#a6762e",
          700: "#855928",
          800: "#6e4925",
          900: "#5d3d22",
        },
        surface: {
          DEFAULT: "#0a0a0b",
          card: "#141416",
          muted: "#27272a",
        },
        dark: {
          surface: "#0a0a0b",
          card: "#141416",
          muted: "#27272a",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
  darkMode: "class",
};

export default config;
