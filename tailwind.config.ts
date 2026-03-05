import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F6F2E8",
        ink: "#11222E",
        accent: "#E16A2F",
        support: "#0C6A6D",
        paper: "#FFFDF8"
      },
      boxShadow: {
        card: "0 14px 40px rgba(17, 34, 46, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
