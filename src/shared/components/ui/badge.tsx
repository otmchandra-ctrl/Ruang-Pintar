import * as React from "react";

export type BadgeVariant =
  "neutral" | "info" | "success" | "warning" | "danger" | "cobalt" | "academic";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: "sm" | "default";
  hasDot?: boolean;
}

export function Badge({
  className = "",
  variant = "neutral",
  size = "default",
  hasDot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    neutral:
      "bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    info: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
    success:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    warning:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    danger:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
    cobalt:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    academic:
      "bg-slate-900 text-white border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700",
  };

  const dotStyles: Record<BadgeVariant, string> = {
    neutral: "bg-slate-400 dark:bg-slate-500",
    info: "bg-sky-500 dark:bg-sky-400",
    success: "bg-emerald-500 dark:bg-emerald-400",
    warning: "bg-amber-500 dark:bg-amber-400",
    danger: "bg-red-500 dark:bg-red-400",
    cobalt: "bg-blue-500 dark:bg-blue-400",
    academic: "bg-white dark:bg-slate-300",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    default: "px-2.5 py-0.5 text-xs gap-1.5",
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border font-semibold tracking-wide transition-colors ${
        variantStyles[variant] || variantStyles.neutral
      } ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {hasDot && (
        <span
          className={`size-1.5 rounded-full shrink-0 ${dotStyles[variant] || dotStyles.neutral}`}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
