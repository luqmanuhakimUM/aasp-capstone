"use client";

import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import { Locale, useI18n } from "@/lib/i18n";

export default function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  const { user } = useAuth();

  const choose = (next: Locale) => {
    setLocale(next);
    // FR-27: keep the account's stored preference in sync so it follows the
    // student to their next device -- best-effort, never blocks the toggle.
    if (user) {
      api.patch("/api/auth/me", { language_pref: next }).catch(() => {});
    }
  };

  return (
    <div className="flex items-center rounded-full border border-line bg-surface-elevated p-0.5 text-xs font-semibold">
      <button
        onClick={() => choose("en")}
        className={
          "rounded-full px-3 py-1.5 transition-colors " +
          (locale === "en" ? "bg-sidebar text-sidebar-fg" : "text-ink-secondary")
        }
      >
        EN
      </button>
      <button
        onClick={() => choose("ms")}
        className={
          "rounded-full px-3 py-1.5 transition-colors " +
          (locale === "ms" ? "bg-sidebar text-sidebar-fg" : "text-ink-secondary")
        }
      >
        BM
      </button>
    </div>
  );
}
