import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mahogany: "#2e0e02",
        chestnut: "#8B271E",
        pearl: "#E9DFD3",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        accent: ["var(--font-accent)", "sans-serif"],
        body: ["var(--font-body)", "Georgia", "serif"],
      },
      maxWidth: {
        content: "1120px",
      },
    },
  },
  plugins: [],
};

export default config;
