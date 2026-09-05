"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  BookOpenCheck,
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  PenLine,
  Search,
  Settings2,
  ShieldCheck,
  Link2 as SourcesIcon,
  X,
} from "lucide-react";
import React, { useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";

const NAV_ITEMS = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/research", key: "research", icon: Search },
  { href: "/integrity", key: "integrity", icon: ShieldCheck },
  { href: "/writing", key: "writing", icon: PenLine },
  { href: "/sources", key: "sources", icon: SourcesIcon },
] as const;

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
  className = "",
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={
        "group relative flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors " +
        (active ? "" : "hover:bg-sidebar-accent") +
        " " +
        className
      }
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-xl bg-sidebar-active"
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        />
      )}
      <Icon className={"relative z-10 h-[17px] w-[17px] " + (active ? "text-sidebar-active-fg" : "text-sidebar-muted group-hover:text-white")} />
      <span className={"relative z-10 " + (active ? "font-semibold text-sidebar-active-fg" : "text-sidebar-muted group-hover:text-white")}>
        {label}
      </span>
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) {
    return <main className="min-h-screen">{children}</main>;
  }

  const isPolicyAdmin = user.role === "policy_admin" || user.role === "super_admin";
  const isSuperAdmin = user.role === "super_admin";
  const initials = user.email.slice(0, 2).toUpperCase();

  const go = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-surface text-ink-primary">
      <aside
        className={
          "material-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col px-4 py-5 text-sidebar-fg transition-transform duration-200 lg:translate-x-0 " +
          (mobileOpen ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex items-center justify-between px-2">
          <Link href="/dashboard" onClick={go} className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white">
              <BookOpenCheck className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[15px] font-semibold leading-none tracking-tight">{t("appName")}</span>
              <span className="mt-1 block text-[10px] uppercase tracking-[.17em] text-sidebar-muted">
                academic success
              </span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-accent lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-sidebar-muted">
          Workspace
        </div>
        <nav className="mt-3 space-y-1">
          {NAV_ITEMS.map(({ href, key, icon }) => (
            <SidebarLink key={href} href={href} label={t(`nav.${key}`)} icon={icon} active={pathname === href} onNavigate={go} />
          ))}
        </nav>

        {(isPolicyAdmin || isSuperAdmin) && (
          <>
            <div className="my-6 border-t border-sidebar-accent" />
            <div className="px-2 text-[10px] font-bold uppercase tracking-[.18em] text-sidebar-muted">
              Institution tools
            </div>
            <div className="mt-3 space-y-1">
              {isPolicyAdmin && (
                <SidebarLink
                  href="/admin/policies"
                  label={t("nav.admin")}
                  icon={Settings2}
                  active={pathname === "/admin/policies"}
                  onNavigate={go}
                />
              )}
              {isSuperAdmin && (
                <SidebarLink
                  href="/super-admin/tenants"
                  label={t("nav.super-admin")}
                  icon={Building2}
                  active={pathname === "/super-admin/tenants"}
                  onNavigate={go}
                />
              )}
            </div>
          </>
        )}

        <div className="mt-auto flex items-center gap-3 border-t border-sidebar-accent px-2 pt-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber text-sm font-bold text-amber-ink">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user.email}</div>
            <div className="truncate text-[11px] capitalize text-sidebar-muted">{user.role.replace("_", " ")}</div>
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-accent hover:text-white"
            aria-label={t("nav.logout")}
            title={t("nav.logout")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-sidebar/40 lg:hidden"
          aria-label="Close navigation overlay"
        />
      )}

      <main className="min-h-screen lg:pl-64">
        <header className="material-chrome sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-line bg-surface-elevated p-2 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden text-sm text-ink-secondary sm:inline">
              {t("appName")} / <span className="font-semibold text-ink-primary">{t(`nav.${pathname.split("/")[1] || "dashboard"}`)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="mx-auto max-w-[1200px] px-4 py-7 md:px-8 md:py-9"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
