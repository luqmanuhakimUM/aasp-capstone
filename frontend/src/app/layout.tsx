import type { Metadata } from "next";
import { MotionConfig } from "motion/react";
import React from "react";

import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: "AI Academic Success Platform",
  description: "Research, writing, and academic integrity support for B40 students.",
};

// Runs before React hydrates so the page never flashes the wrong theme.
const noFlashThemeScript = `
(function () {
  try {
    var stored = localStorage.getItem("aasp_theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className="bg-surface text-ink-primary">
        <MotionConfig reducedMotion="user">
          <ThemeProvider>
            <I18nProvider>
              <AuthProvider>
                <AppShell>{children}</AppShell>
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
