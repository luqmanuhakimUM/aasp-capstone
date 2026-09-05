"use client";

import Link from "next/link";
import { BookOpenCheck, LockKeyhole, PenLine, Search, ShieldCheck, Link2 as SourcesIcon } from "lucide-react";
import React from "react";

import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";

const FEATURES = [
  { key: "research", icon: Search },
  { key: "integrity", icon: ShieldCheck },
  { key: "writing", icon: PenLine },
  { key: "sources", icon: SourcesIcon },
] as const;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="material-sidebar relative hidden flex-col items-center justify-between overflow-hidden px-12 py-12 text-sidebar-fg lg:flex">
        <Link href="/" className="relative flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-500 text-white">
            <BookOpenCheck className="h-7 w-7" />
          </span>
          <span className="text-2xl font-semibold tracking-tight">{t("appName")}</span>
        </Link>

        <div className="relative max-w-md text-center">
          <div className="text-eyebrow text-sidebar-muted">{t("auth.overviewEyebrow")}</div>
          <h1 className="mt-2 text-title text-white">{t("auth.overviewTitle")}</h1>
          <p className="mt-3 text-caption text-sidebar-muted">{t("auth.overviewDescription")}</p>

          <ul className="mt-12 space-y-5">
            {FEATURES.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sidebar-accent text-sidebar-fg">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-lg font-semibold text-sidebar-fg">{t(`nav.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-start gap-2 border-t border-sidebar-accent pt-6 text-caption text-sidebar-muted">
          <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("dashboard.goal")}
        </div>
      </div>

      <div className="relative flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="absolute right-6 top-6 flex items-center gap-2 sm:right-10 lg:right-16">
          <ThemeToggle />
          <LanguageToggle />
        </div>
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-500 text-white">
              <BookOpenCheck className="h-6 w-6" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-ink-primary">{t("appName")}</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
