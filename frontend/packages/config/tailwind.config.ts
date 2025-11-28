import type { Config } from "tailwindcss";

export const sharedTailwindConfig: Partial<Config> = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: {
          DEFAULT: "#1e1e1e",
          muted: "#252525"
        },
        border: "#2a2a2a",
        primary: "#3b82f6",
        success: "#22c55e",
        danger: "#ef4444",
        warning: "#f59e0b",
        text: {
          primary: "#ffffff",
          secondary: "#a0a0a0"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        "glow-sm": "0 0 10px rgba(59, 130, 246, 0.35)",
        "glow": "0 0 25px rgba(59, 130, 246, 0.45)"
      }
    }
  }
};

const config: Config = {
  content: [],
  presets: [sharedTailwindConfig as Config]
};

export default config;
