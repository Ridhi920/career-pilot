import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* MISSION OPS — phosphor telemetry lamps */
        signal: "hsl(var(--signal))",   /* phosphor mint — nominal / primary  */
        data: "hsl(var(--data))",       /* ice cyan       — information       */
        caution: "hsl(var(--caution))", /* solar amber    — attention         */
        alert: "hsl(var(--alert))",     /* flare red      — warning           */
        ghost: "hsl(var(--ghost))",     /* drift violet   — simulation        */
        /* legacy aliases (old flight-deck names) so nothing breaks */
        command: "hsl(var(--signal))",
        radar: "hsl(var(--signal))",
        sky: "hsl(var(--data))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 1px)",
        sm: "calc(var(--radius) - 1px)",
      },
      boxShadow: {
        glow: "0 0 24px -4px hsl(var(--signal) / 0.5)",
        "glow-sm": "0 0 12px -2px hsl(var(--signal) / 0.4)",
        "glow-data": "0 0 18px -4px hsl(var(--data) / 0.45)",
        "glow-alert": "0 0 18px -4px hsl(var(--alert) / 0.5)",
        "glow-ghost": "0 0 18px -4px hsl(var(--ghost) / 0.5)",
        panel: "inset 0 1px 0 0 hsl(var(--foreground) / 0.04)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "lamp-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        "orbit-spin": {
          to: { transform: "rotate(360deg)" },
        },
        "sweep-spin": {
          to: { transform: "rotate(360deg)" },
        },
        "scan-y": {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
        "drift": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "ping-soft": {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(2.6)", opacity: "0" },
        },
        "marquee": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        blink: "blink 1.1s step-end infinite",
        "lamp-pulse": "lamp-pulse 2.2s ease-in-out infinite",
        "orbit-spin": "orbit-spin 90s linear infinite",
        "sweep-spin": "sweep-spin 6s linear infinite",
        "scan-y": "scan-y 2.4s ease-in-out infinite alternate",
        drift: "drift 7s ease-in-out infinite",
        "ping-soft": "ping-soft 2.4s cubic-bezier(0,0,0.2,1) infinite",
        marquee: "marquee 40s linear infinite",
      },
      transitionTimingFunction: {
        ops: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
