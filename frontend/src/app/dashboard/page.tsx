"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Link2, PenLine, Search, ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { staggerContainer, staggerItem } from "@/components/ui/motionPresets";
import { useI18n } from "@/lib/i18n";

const CARDS = [
  { href: "/research", key: "research", icon: Search, tone: "brand" as const },
  { href: "/integrity", key: "integrity", icon: ShieldCheck, tone: "amber" as const },
  { href: "/writing", key: "writing", icon: PenLine, tone: "purple" as const },
  { href: "/sources", key: "sources", icon: Link2, tone: "neutral" as const },
];

const ICON_TONE_CLASSES: Record<(typeof CARDS)[number]["tone"], string> = {
  brand: "bg-brand-500 text-white",
  amber: "bg-amber text-amber-ink",
  purple: "bg-purple-text text-white",
  neutral: "bg-neutral-text text-white",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <div className="space-y-9">
      <section className="rounded-3xl bg-brand-tint px-6 py-8 md:px-10 md:py-10">
        <div className="max-w-2xl">
          <div className="mb-3 text-eyebrow">{t("dashboard.subtitle")}</div>
          <h1 className="text-display text-ink-primary">
            {t("dashboard.welcome")}
            {user ? `, ${user.email}` : ""}
          </h1>
          <p className="mt-3 max-w-md text-body text-ink-secondary">{t("dashboard.goal")}</p>
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
