import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0d1117",
          panel: "#11151c",
          raised: "#161b22",
          deep: "#1a1a2e",
          inset: "#0a0d12",
        },
        line: {
          DEFAULT: "#1f2630",
          strong: "#2a3340",
          subtle: "#171c25",
        },
        ink: {
          DEFAULT: "#e6edf3",
          muted: "#8b949e",
          dim: "#6b7380",
          faint: "#4a525e",
        },
        accent: {
          yellow: "#ecad0a",
          blue: "#209dd7",
          purple: "#753991",
        },
        signal: {
          up: "#3fb950",
          upGlow: "#3fb95022",
          down: "#f85149",
          downGlow: "#f8514922",
          flat: "#6b7380",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "12px", letterSpacing: "0.06em" }],
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.02) inset, 0 0 0 1px rgba(255,255,255,0.02)",
        inset: "inset 0 0 0 1px rgba(255,255,255,0.04)",
        glowYellow: "0 0 28px rgba(236,173,10,0.18)",
        glowBlue: "0 0 28px rgba(32,157,215,0.22)",
      },
      animation: {
        "flash-up": "flashUp 600ms ease-out",
        "flash-down": "flashDown 600ms ease-out",
        "pulse-dot": "pulseDot 1.6s ease-in-out infinite",
        scanline: "scanline 6s linear infinite",
      },
      keyframes: {
        flashUp: {
          "0%": { backgroundColor: "rgba(63,185,80,0.32)" },
          "100%": { backgroundColor: "rgba(63,185,80,0)" },
        },
        flashDown: {
          "0%": { backgroundColor: "rgba(248,81,73,0.32)" },
          "100%": { backgroundColor: "rgba(248,81,73,0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
