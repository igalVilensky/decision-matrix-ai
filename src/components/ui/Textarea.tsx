import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helperText?: string;
};

export const Textarea = ({
  label,
  helperText,
  className = "",
  id,
  ...props
}: TextareaProps) => {
  const textareaId = id ?? props.name;

  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-semibold text-ink-700">{label}</span> : null}
      <textarea
        id={textareaId}
        className={`min-h-28 w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-500 ${className}`}
        {...props}
      />
      {helperText ? <span className="text-xs text-ink-500">{helperText}</span> : null}
    </label>
  );
};
