import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: "default" | "soft" | "accent";
};

const toneClasses = {
  default: "border-ink-200 bg-white",
  soft: "border-ink-100 bg-ink-50/80",
  accent: "border-brand-100 bg-brand-50/80"
};

export const Card = ({ children, className = "", tone = "default", ...props }: CardProps) => (
  <div
    className={`rounded-lg border shadow-soft ${toneClasses[tone]} ${className}`}
    {...props}
  >
    {children}
  </div>
);
