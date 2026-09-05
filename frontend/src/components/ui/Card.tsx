"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import React from "react";

interface CardProps extends Omit<HTMLMotionProps<"div">, "className"> {
  interactive?: boolean;
  tint?: "none" | "brand" | "warning" | "danger" | "purple" | "sidebar";
  className?: string;
}

const TINTS: Record<NonNullable<CardProps["tint"]>, string> = {
  none: "border-line bg-surface-elevated",
  brand: "border-brand-100 bg-brand-50",
  warning: "border-warning-bg bg-warning-bg",
  danger: "border-danger-bg bg-danger-bg",
  purple: "border-purple-bg bg-purple-bg",
  sidebar: "border-sidebar-accent bg-sidebar text-sidebar-fg",
};

export default function Card({ interactive = false, tint = "none", className = "", children, ...props }: CardProps) {
  return (
    <motion.div
      className={
        "material-card rounded-2xl border p-5 " +
        TINTS[tint] +
        (interactive ? " cursor-pointer transition-colors hover:border-brand-200 hover:shadow-lift" : "") +
        " " +
        className
      }
      whileHover={interactive ? { y: -2 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
