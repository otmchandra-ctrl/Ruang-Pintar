import * as React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  selectSize?: "sm" | "default" | "lg";
  isError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className = "", selectSize = "default", isError = false, disabled, children, ...props },
    ref
  ) => {
    const sizeStyles = {
      sm: "min-h-[44px] sm:min-h-[36px] h-auto sm:h-9 pl-3 pr-8 text-base sm:text-xs rounded-lg",
      default: "h-11 pl-3.5 pr-9 text-base sm:text-sm rounded-[10px]",
      lg: "h-12 pl-4 pr-10 text-base sm:text-[15px] rounded-[10px]",
    };

    const errorStyles = isError
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 dark:border-rose-600 dark:text-rose-100"
      : "border-[#CBD5E1] focus:border-[#3B82F6] focus:ring-[#3B82F6]/25 text-[#0F172A] dark:border-slate-700 dark:text-slate-100";

    return (
      <div className="relative w-full">
        <select
          ref={ref}
          disabled={disabled}
          className={`w-full appearance-none border bg-white dark:bg-slate-900 focus:outline-none focus:ring-3 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:opacity-60 transition-all duration-160 cursor-pointer ${sizeStyles[selectSize]} ${errorStyles} ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
      </div>
    );
  }
);

Select.displayName = "Select";
