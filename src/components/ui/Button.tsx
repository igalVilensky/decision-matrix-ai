import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  isLoading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 disabled:bg-brand-300",
  secondary:
    "bg-ink-900 text-white shadow-sm hover:bg-ink-700 disabled:bg-ink-300",
  ghost: "bg-transparent text-ink-600 hover:bg-ink-100 disabled:text-ink-300",
  danger:
    "bg-coral-600 text-white shadow-sm hover:bg-coral-500 disabled:bg-coral-200",
  outline:
    "border border-ink-200 bg-white text-ink-700 hover:border-brand-500 hover:text-brand-700 disabled:text-ink-300"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
  icon: "h-10 w-10 p-0"
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading ? (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    ) : (
      icon
    )}
    {size !== "icon" ? children : <span className="sr-only">{children}</span>}
  </button>
);
