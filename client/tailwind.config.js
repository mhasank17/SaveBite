/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors (Botanic Freshness & Safety)
        "primary": "#006030",
        "primary-container": "#1b7a43",
        "on-primary": "#ffffff",
        "on-primary-container": "#abffbf",
        "primary-fixed": "#9bf6b2",
        "primary-fixed-dim": "#80d998",
        "on-primary-fixed": "#00210d",
        "on-primary-fixed-variant": "#005228",
        "inverse-primary": "#80d998",

        // Secondary Colors (Urgency, Flash Deals & Discounts)
        "secondary": "#a83900",
        "secondary-container": "#fc6018",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#531800",
        "secondary-fixed": "#ffdbcf",
        "secondary-fixed-dim": "#ffb59a",
        "on-secondary-fixed": "#380d00",
        "on-secondary-fixed-variant": "#802a00",

        // Tertiary Colors (Ratings, Delis & Highlights)
        "tertiary": "#754900",
        "tertiary-container": "#965e00",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#ffe8d1",
        "tertiary-fixed": "#ffddb8",
        "tertiary-fixed-dim": "#ffb95f",
        "on-tertiary-fixed": "#2a1700",
        "on-tertiary-fixed-variant": "#653e00",

        // Surface & Background Layers (Clean food-grade clarity)
        "surface": "#f9f9ff",
        "surface-bright": "#f9f9ff",
        "surface-dim": "#cfdaf2",
        "surface-variant": "#d8e3fb",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f0f3ff",
        "surface-container": "#e7eeff",
        "surface-container-high": "#dee8ff",
        "surface-container-highest": "#d8e3fb",
        "surface-tint": "#016d38",

        "background": "#f9f9ff",
        "on-background": "#111c2d",
        "on-surface": "#111c2d",
        "on-surface-variant": "#3f4940",
        "inverse-surface": "#263143",
        "inverse-on-surface": "#ecf1ff",

        // Borders and Dividers
        "outline": "#6f7a6f",
        "outline-variant": "#becabd",

        // Feedback & Errors
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
      },
      fontFamily: {
        "display": ["Plus Jakarta Sans", "sans-serif"],
        "headline": ["Plus Jakarta Sans", "sans-serif"],
        "title": ["Plus Jakarta Sans", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"],
        "sans": ["Inter", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.015em", fontWeight: "700" }],
        "headline-lg-mobile": ["26px", { lineHeight: "34px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-sm": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "title-md": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "label-lg": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "600" }],
        "label-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.04em", fontWeight: "700" }],
      },
      spacing: {
        "space-2xs": "0.25rem",
        "space-xs": "0.5rem",
        "space-sm": "0.75rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2rem",
        "space-2xl": "3rem",
        "space-3xl": "4rem",
        "gutter-mobile": "1rem",
        "gutter-tablet": "1.5rem",
        "gutter-desktop": "2rem",
        "margin-mobile": "1rem",
        "margin-tablet": "2rem",
        "margin-desktop": "3rem",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "sm": "0.25rem",
        "md": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "2xl": "1.5rem",
        "full": "9999px",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-20%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-once": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slide-down 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-once": "pulse-once 0.6s ease-in-out",
      },
    },
  },
  plugins: [],
};
