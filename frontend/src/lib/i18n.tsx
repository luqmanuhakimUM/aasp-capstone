"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import en from "../../messages/en.json";
import ms from "../../messages/ms.json";

export type Locale = "en" | "ms";

const messages: Record<Locale, Record<string, unknown>> = { en, ms };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function resolve(dict: Record<string, unknown>, key: string): string {
  const value = key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
  return typeof value === "string" ? value : key;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("aasp_locale") : null;
    if (stored === "en" || stored === "ms") setLocaleState(stored);
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") window.localStorage.setItem("aasp_locale", next);
  };

  const t = useMemo(() => {
    const dict = messages[locale];
    return (key: string) => resolve(dict, key);
  }, [locale]);

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
