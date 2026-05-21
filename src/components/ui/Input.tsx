import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
};

export const Input = ({ label, helperText, className = "", id, ...props }: InputProps) => {
  const inputId = id ?? props.name;

  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-semibold text-ink-700">{label}</span> : null}
      <input
        id={inputId}
        className={`min-h-11 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-500 ${className}`}
        {...props}
      />
      {helperText ? <span className="text-xs text-ink-500">{helperText}</span> : null}
    </label>
  );
};
