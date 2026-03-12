import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FFFFFF",
        "canvas-soft": "#F9F7F3",
        ink: "#1A1A1A",
        "ink-light": "#6B6B6B",
        accent: "#FFDD00",
        "accent-dark": "#E5C700",
        brand: "#29ABE0",
        support: "#0C6A6D",
        paper: "#FFFFFF",
        border: "#EBEBEB"
      },
      boxShadow: {
        card: "0 2px 16px 0 rgba(0,0,0,0.06)",
        "card-hover": "0 8px 40px 0 rgba(0,0,0,0.12)",
        glass: "0 8px 32px 0 rgba(0,0,0,0.06)",
        btn: "0 2px 8px 0 rgba(0,0,0,0.10)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "var(--font-noto-sans-kr)", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
