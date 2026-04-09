import { forwardRef, InputHTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Search } from "lucide-react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label displayed above input */
  label?: string;
  /** Helper text displayed below input */
  helperText?: string;
  /** Error text displayed below input (overrides helperText) */
  errorText?: string;
  /** Show error state styling */
  error?: boolean;
}

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label displayed above input */
  label?: string;
  /** Helper text displayed below input */
  helperText?: string;
  /** Error text displayed below input */
  errorText?: string;
  /** Show error state styling */
  error?: boolean;
}

/**
 * Text input with consistent styling and optional label/error text.
 * Supports multiple input types with focus ring styling.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorText,
      error = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputClasses = clsx(
      "w-full border rounded-lg px-3 py-2 text-sm bg-card transition-all duration-150 shadow-xs",
      "placeholder:text-ink-muted",
      error
        ? "border-red-300 focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none"
        : "border-line/60 focus:ring-2 focus:ring-accent/10 focus:border-accent outline-none",
      disabled && "bg-surface-hover text-ink-muted cursor-not-allowed"
    );

    const classes = twMerge(inputClasses, className);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-ink-secondary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={classes}
          disabled={disabled}
          aria-invalid={error}
          {...props}
        />
        {(errorText || helperText) && (
          <p
            className={clsx(
              "text-xs mt-1",
              errorText ? "text-red-600" : "text-ink-muted"
            )}
          >
            {errorText || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/**
 * Search input with magnifying glass icon prefix.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      label,
      helperText,
      errorText,
      error = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputClasses = clsx(
      "w-full border rounded-lg pl-9 pr-3 py-2 text-sm bg-card transition-all duration-150 shadow-xs",
      "placeholder:text-ink-muted",
      error
        ? "border-red-300 focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none"
        : "border-line/60 focus:ring-2 focus:ring-accent/10 focus:border-accent outline-none",
      disabled && "bg-surface-hover text-ink-muted cursor-not-allowed"
    );

    const classes = twMerge(inputClasses, className);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-ink-secondary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-ink-muted pointer-events-none" />
          <input
            ref={ref}
            type="search"
            className={classes}
            disabled={disabled}
            aria-invalid={error}
            {...props}
          />
        </div>
        {(errorText || helperText) && (
          <p
            className={clsx(
              "text-xs mt-1",
              errorText ? "text-red-600" : "text-ink-muted"
            )}
          >
            {errorText || helperText}
          </p>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
