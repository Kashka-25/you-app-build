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
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        textMuted: "var(--text-muted)",
        borderC: "var(--border)"
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["DM Sans", "-apple-system", "sans-serif"]
      },
      borderRadius: {
        card: "20px"
      }
    }
  },
  plugins: []
};
