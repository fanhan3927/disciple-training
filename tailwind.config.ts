import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        field: "#f6f7f4",
        moss: "#4e6b57",
        pine: "#1f4f43",
        clay: "#a35436",
        gold: "#b7862b",
        mist: "#dfe8e1",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        focus: "0 0 0 3px rgba(31, 79, 67, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
