import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07101f",
        panel: "#0d1b30",
        cyan: "#34d8f3",
        success: "#4de6a8",
        warning: "#f8bd4f",
      },
      boxShadow: {
        glow: "0 0 32px rgba(52, 216, 243, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
