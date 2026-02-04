import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0f14",
        slate: "#1f2937",
        mint: "#1ca97a",
        amber: "#f59e0b",
        river: "#0ea5e9",
        fog: "#f1f5f9"
      },
      boxShadow: {
        card: "0 12px 40px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
