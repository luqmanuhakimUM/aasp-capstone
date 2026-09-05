"use client";

import { motion } from "motion/react";

export default function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={
        "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 " +
        (checked ? "bg-brand-500" : "bg-neutral-bg")
      }
    >
      <motion.span
        layout
        transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card"
        style={{ left: checked ? "calc(100% - 22px)" : "2px" }}
      />
    </button>
  );
}
