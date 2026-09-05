import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          tint: "var(--brand-tint)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-bg)",
          fg: "var(--sidebar-fg)",
          muted: "var(--sidebar-muted)",
          accent: "var(--sidebar-accent)",
          active: "var(--sidebar-active-bg)",
          "active-fg": "var(--sidebar-active-fg)",
        },
        surface: {
          DEFAULT: "var(--bg)",
          elevated: "var(--bg-elevated)",
          translucent: "var(--bg-elevated-translucent)",
          sunken: "var(--bg-sunken)",
        },
        ink: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        line: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        success: { bg: "var(--success-bg)", text: "var(--success-text)" },
        warning: { bg: "var(--warning-bg)", text: "var(--warning-text)" },
        danger: { bg: "var(--danger-bg)", text: "var(--danger-text)" },
        purple: { bg: "var(--purple-bg)", text: "var(--purple-text)" },
        neutral: { bg: "var(--neutral-bg)", text: "var(--neutral-text)" },
        amber: { DEFAULT: "var(--amber-accent)", ink: "var(--amber-accent-ink)" },
      },
      boxShadow: {
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
        chrome: "var(--shadow-chrome)",
      },
    },
  },
  plugins: [],
};

export default config;
