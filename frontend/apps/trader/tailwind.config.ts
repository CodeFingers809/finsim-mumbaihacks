import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/hooks/**/*.{js,ts,jsx,tsx}",
        "./src/lib/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: {
                    DEFAULT: "#0c0d10",
                    elevated: "#12131a",
                },
                surface: {
                    DEFAULT: "#171921",
                    muted: "#1e2028",
                    hover: "#252730",
                },
                border: {
                    DEFAULT: "#2d303a",
                    subtle: "#23252e",
                },
                primary: {
                    DEFAULT: "#6c8cff",
                    muted: "#4a6bde",
                    foreground: "#ffffff",
                },
                secondary: {
                    DEFAULT: "#1e2028",
                    foreground: "#e8eaed",
                },
                muted: {
                    DEFAULT: "#1e2028",
                    foreground: "#8b8f9a",
                },
                accent: {
                    DEFAULT: "#1e2028",
                    foreground: "#e8eaed",
                },
                destructive: {
                    DEFAULT: "#f06c6c",
                    foreground: "#ffffff",
                },
                success: {
                    DEFAULT: "#3dd68c",
                    muted: "#2a9d66",
                },
                warning: {
                    DEFAULT: "#f5b03d",
                    muted: "#c98f2a",
                },
                text: {
                    primary: "#e8eaed",
                    secondary: "#8b8f9a",
                    muted: "#5c606c",
                },
                popover: {
                    DEFAULT: "#12131a",
                    foreground: "#e8eaed",
                },
                card: {
                    DEFAULT: "#12131a",
                    foreground: "#e8eaed",
                },
            },
            fontFamily: {
                sans: [
                    "var(--font-geist-sans)",
                    "Inter",
                    "system-ui",
                    "sans-serif",
                ],
                mono: ["var(--font-geist-mono)", "monospace"],
            },
            boxShadow: {
                "glow-sm": "0 0 10px rgba(108, 140, 255, 0.2)",
                glow: "0 0 20px rgba(108, 140, 255, 0.3)",
                "glow-lg": "0 0 30px rgba(108, 140, 255, 0.4)",
            },
            borderRadius: {
                lg: "0.75rem",
                md: "0.5rem",
                sm: "0.25rem",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [tailwindcssAnimate],
};

export default config;

