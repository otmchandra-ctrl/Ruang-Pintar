import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", isError = false, disabled, rows = 3, ...props }, ref) => {
    const errorStyles = isError
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 dark:border-rose-600 dark:text-rose-100"
      : "border-[#CBD5E1] focus:border-[#3B82F6] focus:ring-[#3B82F6]/25 text-[#0F172A] dark:border-slate-700 dark:text-slate-100";

    return (
      <textarea
        ref={ref}
        disabled={disabled}
        rows={rows}
        className={`w-full border bg-white dark:bg-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-3 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:opacity-60 transition-all duration-160 p-3.5 text-base sm:text-sm rounded-[10px] resize-y ${errorStyles} ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
