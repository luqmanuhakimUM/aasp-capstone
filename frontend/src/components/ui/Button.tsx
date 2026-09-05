"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import React from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-500",
  secondary: "bg-surface-elevated text-ink-primary border border-line hover:border-line-strong",
  ghost: "bg-transparent text-ink-secondary hover:text-brand-700 hover:bg-brand-tint",
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
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold " +
        "disabled:cursor-not-allowed disabled:opacity-50 " +
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
