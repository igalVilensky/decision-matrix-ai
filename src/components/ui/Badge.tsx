import type { ReactNode } from "react";

type BadgeTone = "default" | "green" | "amber" | "red" | "blue";

const toneClasses: Record<BadgeTone, string> = {
  default: "bg-ink-100 text-ink-700",
  green: "bg-brand-100 text-brand-700",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-sky-100 text-sky-700"
};

export const Badge = ({
  children,
  tone = "default"
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}
  >
    {children}
  </span>
);
