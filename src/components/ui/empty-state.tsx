import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface EmptyStateProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Title text */
  title: string;
  /** Description text */
  description: string;
  /** Optional action button or content */
  action?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty state placeholder component.
 * Displays centered icon, title, description, and optional action.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in"
        ),
        className
      )}
    >
      <div className="bg-accent-light rounded-xl shadow-xs p-4 mb-4">
        <Icon className="h-12 w-12 text-accent mx-auto" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold tracking-tight text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink-muted mb-6 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
