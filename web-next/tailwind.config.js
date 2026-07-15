/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["class", '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface1: "var(--surface-1)",
        surface2: "var(--surface-2)",
        surface3: "var(--surface-3)",
        forest: "var(--forest)",
        forestAccent: "var(--forest-accent)",
        sage: "var(--sage)",
        gold: "var(--gold)",
        cream: "var(--cream)",
        ember: "var(--ember)",
        accentBlue: "var(--accent-blue)",
        error: "var(--error)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        textMuted: "var(--text-muted)",
        borderC: "var(--border)"
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["DM Sans", "-apple-system", "sans-serif"]
      },
      // Locked type scale (Phase 0). Use these names, not arbitrary
      // text-[13px] values, on any new screen work from here on.
      fontSize: {
        hero: ["28px", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        h1: ["22px", { lineHeight: "1.2" }],
        h2: ["19px", { lineHeight: "1.25" }],
        h3: ["16px", { lineHeight: "1.3" }],
        body: ["14px", { lineHeight: "1.55" }],
        bodySm: ["13px", { lineHeight: "1.5" }],
        caption: ["12px", { lineHeight: "1.4" }],
        label: ["11px", { lineHeight: "1.3", letterSpacing: "0.04em" }]
      },
      borderRadius: {
        card: "20px",
        sm: "12px"
      },
      // Locked shadow for elevated/glass surfaces.
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,0.10)",
        cardDark: "0 8px 24px rgba(0,0,0,0.45)",
        glass: "0 1px 0 rgba(255,255,255,0.06) inset"
      }
    }
  },
  plugins: []
};
