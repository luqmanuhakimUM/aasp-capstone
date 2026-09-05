"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Link2, PenLine, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { staggerContainer, staggerItem } from "@/components/ui/motionPresets";
import { assetUrl } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

const CARDS = [
  { href: "/research", key: "research", icon: Search, tone: "brand" as const },
  { href: "/integrity", key: "integrity", icon: ShieldCheck, tone: "amber" as const },
  { href: "/writing", key: "writing", icon: PenLine, tone: "purple" as const },
  { href: "/sources", key: "sources", icon: Link2, tone: "neutral" as const },
];

const ICON_TONE_CLASSES: Record<(typeof CARDS)[number]["tone"], string> = {
  brand: "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-[0_6px_16px_-4px_var(--brand-500)] transition-shadow group-hover:shadow-[0_10px_24px_-4px_var(--brand-500)]",
  amber: "bg-amber text-amber-ink shadow-[0_6px_16px_-4px_var(--amber-accent)] transition-shadow group-hover:shadow-[0_10px_24px_-4px_var(--amber-accent)]",
  purple: "bg-purple-text text-white shadow-[0_6px_16px_-4px_var(--purple-text)] transition-shadow group-hover:shadow-[0_10px_24px_-4px_var(--purple-text)]",
  neutral: "bg-neutral-text text-white shadow-[0_6px_16px_-4px_var(--neutral-text)] transition-shadow group-hover:shadow-[0_10px_24px_-4px_var(--neutral-text)]",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [logoAspectRatio, setLogoAspectRatio] = useState(1);

  return (
    <div className="space-y-9">
      <section className="relative overflow-hidden rounded-3xl bg-[var(--dashboard-hero-bg)] px-6 py-8 md:px-10 md:py-10">
        {user?.tenant_logo_url && (
          <div className="pointer-events-none absolute inset-y-0 left-1/2 right-0 hidden items-center justify-center px-8 py-6 md:flex md:py-8">
            <div
              className="relative h-full max-w-full"
              style={{ aspectRatio: logoAspectRatio, transform: `scale(${user.tenant_logo_scale / 100})` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl(user.tenant_logo_url)}
                alt={user.tenant_name}
                className="h-full w-full object-contain"
                onLoad={(e) => {
                  const { naturalWidth, naturalHeight } = e.currentTarget;
                  if (naturalWidth && naturalHeight) setLogoAspectRatio(naturalWidth / naturalHeight);
                }}
              />
            </div>
          </div>
        )}

        <div className="relative min-w-0 max-w-2xl">
          <div className="mb-3 text-eyebrow" style={{ color: "var(--dashboard-hero-eyebrow)" }}>
            {t("dashboard.subtitle")}
          </div>
          <h1 className="text-display break-words" style={{ color: "var(--dashboard-hero-title)" }}>
            {t("dashboard.welcome")}
            {user ? `, ${user.email}` : ""}
          </h1>
          <p className="mt-3 max-w-md text-body" style={{ color: "var(--dashboard-hero-body)" }}>
            {t("dashboard.goal")}
          </p>
          {user?.tenant_logo_url && (
            <p className="mt-4 text-caption font-semibold md:hidden" style={{ color: "var(--dashboard-hero-body)" }}>
              {user.tenant_name}
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-6">
          <div className="mb-1 text-eyebrow">{t("dashboard.quickEyebrow")}</div>
          <h2 className="text-title text-ink-primary">{t("dashboard.quick")}</h2>
        </div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.href} variants={staggerItem} className="h-full">
                <Link
                  href={card.href}
                  className="group flex h-full min-h-[210px] flex-col justify-between rounded-2xl border border-line bg-surface-elevated p-5 shadow-card transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
                >
                  <div>
                    <div className={`mb-6 grid h-10 w-10 place-items-center rounded-xl ${ICON_TONE_CLASSES[card.tone]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-ink-primary">{t(`${card.key}.title`)}</h3>
                    <p className="mt-2 text-[13px] leading-5 text-ink-secondary">{t(`${card.key}.description`)}</p>
                  </div>
                  <span className="mt-5 flex items-center gap-1 text-xs font-bold text-brand-500 group-hover:gap-2">
                    {t(`dashboard.cta.${card.key}`)}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
}
