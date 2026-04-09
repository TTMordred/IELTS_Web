import { ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps {
  /** Card variant style */
  variant?: "bordered" | "flat";
  /** Content to display inside card */
  children: ReactNode;
  /** Use compact padding */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface CardHeaderProps {
  /** Header content */
  children: ReactNode;
  /** Show bottom border separator */
  separator?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface CardContentProps {
  /** Content to display */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export interface CardFooterProps {
  /** Footer content */
  children: ReactNode;
  /** Show top border separator */
  separator?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Clean card wrapper with minimal styling.
 * No colored borders or shadows by default. Uses whitespace for separation.
 * Supports bordered or flat variants.
 */
export function Card({
  variant = "bordered",
  children,
  compact = false,
  className,
}: CardProps) {
  const baseClasses =
    "bg-card rounded-xl overflow-hidden transition-all duration-200 shadow-card hover:shadow-md hover:-translate-y-0.5";
  const variantClasses = {
    bordered: "border border-line",
    flat: "border-0",
  };
  const paddingClasses = compact ? "p-3" : "p-4";

  const classes = twMerge(
    clsx(baseClasses, variantClasses[variant], paddingClasses),
    className
  );

  return <div className={classes}>{children}</div>;
}

/**
 * Card header sub-component with optional bottom border separator.
 */
export function CardHeader({
  children,
  separator = false,
  className,
}: CardHeaderProps) {
  const baseClasses = "flex items-center justify-between pb-3";
  const borderClasses = separator && "border-b border-line";

  const classes = clsx(baseClasses, borderClasses, className);

  return <div className={classes}>{children}</div>;
}

/**
 * Card content sub-component.
 */
export function CardContent({ children, className }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

/**
 * Card footer sub-component with optional top border separator.
 */
export function CardFooter({
  children,
  separator = false,
  className,
}: CardFooterProps) {
  const baseClasses = "flex items-center justify-between pt-3";
  const borderClasses = separator && "border-t border-line";

  const classes = clsx(baseClasses, borderClasses, className);

  return <div className={classes}>{children}</div>;
}
