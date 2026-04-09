import { forwardRef, SelectHTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Label displayed above select */
  label?: string;
  /** Helper text displayed below select */
  helperText?: string;
  /** Error text displayed below select */
  errorText?: string;
  /** Show error state styling */
  error?: boolean;
  /** Array of options or ReactNode children */
  options?: SelectOption[];
  /** Placeholder option text */
  placeholder?: string;
}

/**
 * Native select dropdown with consistent styling and optional label/error text.
 * Supports both options prop and children for flexibility.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      errorText,
      error = false,
      options,
      placeholder,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const selectClasses = clsx(
      "w-full appearance-none border rounded-lg px-3 py-2 pr-8 text-sm bg-card transition-all duration-150 shadow-xs",
      "text-ink",
      error
        ? "border-red-300 focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none"
        : "border-line/60 focus:ring-2 focus:ring-accent/10 focus:border-accent outline-none",
      disabled && "bg-surface-hover text-ink-muted cursor-not-allowed"
    );

    const classes = twMerge(selectClasses, className);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-ink-secondary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={classes}
            disabled={disabled}
            aria-invalid={error}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options &&
              options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            {children}
          </select>
          <ChevronDown className="absolute right-2.5 top-2 h-4 w-4 text-ink-muted pointer-events-none" />
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

Select.displayName = "Select";
