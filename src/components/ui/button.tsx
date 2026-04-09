import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Show loading spinner */
  loading?: boolean;
  /** Icon to display before text */
  icon?: ReactNode;
  /** Icon-only button (no text) */
  iconOnly?: boolean;
  /** Full width button */
  fullWidth?: boolean;
}

/**
 * Minimalist button component with multiple variants and sizes.
 * Primary (dark), Secondary (bordered), Ghost (minimal), and Danger (error) variants.
 * Supports loading state, icons, and full-width layouts.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconOnly = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary:
        "bg-accent hover:bg-accent-hover text-white shadow-sm hover:shadow-accent active:scale-[0.98] disabled:bg-ink-muted disabled:cursor-not-allowed",
      secondary:
        "bg-card border border-line text-ink-secondary shadow-xs hover:border-accent/40 hover:shadow-sm active:bg-surface-hover disabled:border-line disabled:text-ink-muted disabled:cursor-not-allowed",
      ghost:
        "bg-transparent text-ink-muted hover:text-ink hover:bg-surface-hover active:bg-surface-hover disabled:text-ink-muted disabled:cursor-not-allowed",
      danger:
        "bg-card border border-red-200 text-red-700 hover:bg-red-50 hover:shadow-[0_4px_14px_rgba(229,62,62,0.15)] active:bg-red-100 disabled:border-red-100 disabled:text-red-300 disabled:cursor-not-allowed",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs min-h-[36px]",
      md: "px-3 py-1.5 text-sm",
      lg: "px-4 py-2 text-sm",
    };

    const baseClasses =
      "font-medium rounded-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent inline-flex items-center justify-center gap-2 whitespace-nowrap";

    const classes = twMerge(
      clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        loading && "opacity-75 pointer-events-none"
      ),
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {!iconOnly && children}
          </>
        ) : (
          <>
            {icon && icon}
            {!iconOnly && children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
