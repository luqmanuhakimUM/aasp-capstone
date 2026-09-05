import React from "react";

export const fieldControlClass =
  "w-full rounded-xl border border-line bg-surface-sunken px-3.5 py-3 text-body text-ink-primary " +
  "placeholder:text-ink-tertiary outline-none transition-shadow duration-150 " +
  "focus:border-brand-500 focus:ring-4 focus:ring-brand-tint";

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-eyebrow">{children}</label>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-caption text-danger-text">
      <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-danger-text" aria-hidden />
      {children}
    </p>
  );
}
