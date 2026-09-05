"use client";

import { useEffect, useState } from "react";

import { API_BASE_URL, api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function GoogleButton({ tenantId, disabled = false }: { tenantId?: string; disabled?: boolean }) {
  const { t, locale } = useI18n();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    api
      .get<{ google_enabled: boolean }>("/api/auth/config")
      .then((res) => setEnabled(res.google_enabled))
      .catch(() => setEnabled(false));
  }, []);

  if (!enabled) return null;

  const params = new URLSearchParams({ language_pref: locale });
  if (tenantId) params.set("tenant_id", tenantId);
  const href = `${API_BASE_URL}/api/auth/google/login?${params.toString()}`;

  return (
    <>
      <div className="my-4 flex items-center gap-3 text-caption text-ink-tertiary">
        <span className="h-px flex-1 bg-line" />
        {t("auth.or")}
        <span className="h-px flex-1 bg-line" />
      </div>
      <a
        href={disabled ? undefined : href}
        aria-disabled={disabled}
        onClick={(e) => disabled && e.preventDefault()}
        className={
          "flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface-elevated px-4 py-3 text-sm font-semibold text-ink-primary transition-colors " +
          (disabled ? "cursor-not-allowed opacity-50" : "hover:border-line-strong hover:bg-surface-sunken")
        }
      >
        <svg className="h-4 w-4" viewBox="0 0 18 18" aria-hidden>
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.61z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"
          />
        </svg>
        {t("auth.google")}
      </a>
    </>
  );
}
