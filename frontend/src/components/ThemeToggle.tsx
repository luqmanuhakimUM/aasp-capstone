"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center rounded-full border border-line bg-surface-elevated p-0.5">
      <button
        onClick={() => setTheme("light")}
        aria-label="Light mode"
        className={"rounded-full p-1.5 transition-colors " + (theme === "light" ? "bg-sidebar text-sidebar-fg" : "text-ink-secondary")}
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        aria-label="Dark mode"
        className={"rounded-full p-1.5 transition-colors " + (theme === "dark" ? "bg-sidebar text-sidebar-fg" : "text-ink-secondary")}
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
