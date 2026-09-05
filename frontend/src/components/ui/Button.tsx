"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-[0_4px_14px_-4px_var(--brand-500)] hover:shadow-[0_6px_20px_-2px_var(--brand-500)] hover:brightness-110",
  secondary: "bg-surface-elevated text-ink-primary border border-line hover:border-line-strong",
  ghost: "bg-transparent text-ink-secondary hover:text-brand-700 hover:bg-brand-tint",
  danger:
    "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_4px_14px_-4px_rgba(220,38,38,0.5)] hover:shadow-[0_6px_20px_-2px_rgba(220,38,38,0.5)] hover:brightness-110",
};

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "className" | "children"> {
  variant?: Variant;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", bounce: 0, duration: 0.25 }}
      disabled={disabled || loading}
      className={
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 " +
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:brightness-100 " +
        VARIANT_CLASSES[variant] +
        " " +
        className
      }
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      )}
      {children}
    </motion.button>
  );
}
