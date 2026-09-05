"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // Re-checks localStorage on every call (not just at mount) so that once
    // the student makes an explicit choice, a later OS-level theme change
    // can never silently override it for the rest of the session.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const resolveAndApply = () => {
      const stored = window.localStorage.getItem("aasp_theme");
      const next: Theme = stored === "light" || stored === "dark" ? stored : media.matches ? "dark" : "light";
      setThemeState(next);
      apply(next);
    };
    resolveAndApply();
    media.addEventListener("change", resolveAndApply);
    return () => media.removeEventListener("change", resolveAndApply);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    apply(next);
    window.localStorage.setItem("aasp_theme", next);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
