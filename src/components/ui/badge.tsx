import { ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "purple";

export interface BadgeProps {
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Content to display inside badge */
  children: ReactNode;
  /** Show a 6px colored dot before text */
  dot?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Minimal badge component for status and categories.
 * Supports multiple variants with subtle backgrounds and matching text colors.
 * Optional 6px status dot before text.
 */
export function Badge({
  variant = "default",
  children,
  dot = false,
  className,
}: BadgeProps) {
  const variantClasses = {
    default: "bg-surface-hover text-ink-muted",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    error: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
  };

  const dotClasses = {
    default: "bg-line",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    purple: "bg-purple-500",
  };

  const baseClasses =
    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold shadow-xs";

  const classes = twMerge(
    clsx(baseClasses, variantClasses[variant]),
    className
  );

  return (
    <span className={classes}>
      {dot && (
        <span
          className={clsx("status-dot", dotClasses[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
