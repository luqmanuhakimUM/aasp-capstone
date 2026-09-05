import React from "react";

type Tone = "brand" | "success" | "warning" | "danger" | "purple" | "neutral";

const TONES: Record<Tone, string> = {
  brand: "bg-brand-tint text-brand-700",
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  danger: "bg-danger-bg text-danger-text",
  purple: "bg-purple-bg text-purple-text",
  neutral: "bg-neutral-bg text-neutral-text",
};

export default function Badge({
  tone = "neutral",
  children,
  title,
  className = "",
}: {
  tone?: Tone;
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
