import Link from "next/link";
import { ReactNode } from "react";

export function Button({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-[15px] font-medium transition-transform active:scale-[0.97]";
  const styles =
    variant === "primary"
      ? "bg-(--accent) text-(--accent-foreground)"
      : "text-(--accent) hover:underline";

  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}
