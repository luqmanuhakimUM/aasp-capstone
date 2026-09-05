"use client";

import { motion } from "motion/react";
import React from "react";

export default function PageHeader({
  eyebrow,
  title,
  description,
  disclaimer,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  disclaimer?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      className="flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        {eyebrow && <div className="mb-1.5 text-eyebrow">{eyebrow}</div>}
        <h1 className="text-display text-ink-primary">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-body text-ink-secondary">{description}</p>}
        {disclaimer && (
          <p className="mt-3 rounded-xl bg-warning-bg px-3.5 py-2.5 text-caption text-warning-text">{disclaimer}</p>
        )}
      </div>
      {action}
    </motion.div>
  );
}
