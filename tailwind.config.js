/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFDF5",
        foreground: "#1E293B",
        muted: "#F1F5F9",
        "muted-foreground": "#64748B",
        accent: "#8B5CF6",
        "accent-foreground": "#FFFFFF",
        secondary: "#F472B6",
        tertiary: "#FBBF24",
        quaternary: "#34D399",
        border: "#E2E8F0",
        input: "#FFFFFF",
        card: "#FFFFFF",
        ring: "#8B5CF6",
      },
      fontFamily: {
        heading: ['"Outfit"', "system-ui", "sans-serif"],
        body: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      fontSize: {
        // 1.25 Major Third Scale
        xs: ["0.64rem", { lineHeight: "1rem" }],
        sm: ["0.8rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.25rem", { lineHeight: "1.75rem" }],
        xl: ["1.5625rem", { lineHeight: "2rem" }],
        "2xl": ["1.953rem", { lineHeight: "2.25rem" }],
        "3xl": ["2.441rem", { lineHeight: "2.5rem" }],
        "4xl": ["3.052rem", { lineHeight: "3rem" }],
        "5xl": ["3.815rem", { lineHeight: "3.5rem" }],
      },
      borderRadius: {
        sm: "8px",
        md: "16px",
        lg: "24px",
        full: "9999px",
      },
      boxShadow: {
        "pop": "4px 4px 0px 0px #1E293B",
        "pop-hover": "6px 6px 0px 0px #1E293B",
        "pop-active": "2px 2px 0px 0px #1E293B",
        "sticker": "8px 8px 0px #E2E8F0",
        "sticker-pink": "8px 8px 0px #F472B6",
        "focus": "4px 4px 0px #8B5CF6",
      },
      borderWidth: {
        DEFAULT: "2px",
      },
      animation: {
        "pop-in": "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        "wiggle": "wiggle 0.6s ease-in-out",
      },
      keyframes: {
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        wiggle: {
          "0%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(3deg)" },
          "75%": { transform: "rotate(-3deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
    },
  },
  plugins: [],
};
