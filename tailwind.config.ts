import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F9F7F2",
        ink: "#11222E",
        accent: "#E16A2F",
        support: "#0C6A6D",
        paper: "#FFFFFF"
      },
      boxShadow: {
        card: "0 10px 30px -10px rgba(17, 34, 46, 0.1), 0 4px 10px -5px rgba(17, 34, 46, 0.05)",
        premium: "0 20px 50px -12px rgba(17, 34, 46, 0.15)",
        glass: "0 8px 32px 0 rgba(17, 34, 46, 0.08)"
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-up": "slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "float": "float 6s ease-in-out infinite"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
