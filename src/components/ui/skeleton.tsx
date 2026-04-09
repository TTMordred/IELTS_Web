import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface SkeletonProps {
  /** Width of skeleton */
  width?: string;
  /** Height of skeleton */
  height?: string;
  /** Border radius */
  rounded?: "sm" | "md" | "lg" | "full";
  /** Additional CSS classes */
  className?: string;
}

export interface SkeletonTableProps {
  /** Number of rows to show */
  rows?: number;
  /** Number of columns to show */
  columns?: number;
  /** Compact mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Base skeleton component with pulsing animation.
 * Used for loading states.
 */
export function Skeleton({
  width = "w-full",
  height = "h-4",
  rounded = "md",
  className,
}: SkeletonProps) {
  const roundedClasses = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  const baseClasses = "bg-line/40 animate-pulse";
  const classes = twMerge(
    clsx(baseClasses, width, height, roundedClasses[rounded] || "rounded-lg"),
    className
  );

  return <div className={classes} aria-busy="true" />;
}

/**
 * Skeleton for text content.
 */
export function SkeletonText({
  width = "w-full",
  className,
}: Omit<SkeletonProps, "height" | "rounded">) {
  return <Skeleton width={width} height="h-4" rounded="lg" className={className} />;
}

/**
 * Skeleton for heading content.
 */
export function SkeletonHeading({
  width = "w-3/4",
  className,
}: Omit<SkeletonProps, "height" | "rounded">) {
  return <Skeleton width={width} height="h-6" rounded="lg" className={className} />;
}

/**
 * Skeleton for card placeholder.
 */
export function SkeletonCard({
  className,
}: Omit<SkeletonProps, "width" | "height" | "rounded">) {
  return (
    <div className={twMerge(clsx("rounded-lg border border-line/60 shadow-xs p-4"), className)}>
      <Skeleton width="w-1/2" height="h-6" className="mb-3" rounded="lg" />
      <Skeleton width="w-full" height="h-4" className="mb-2" rounded="lg" />
      <Skeleton width="w-full" height="h-4" className="mb-2" rounded="lg" />
      <Skeleton width="w-3/4" height="h-4" rounded="lg" />
    </div>
  );
}

/**
 * Skeleton for table row.
 */
export function SkeletonTableRow({
  columns = 4,
  compact = false,
}: Omit<SkeletonProps, "width" | "height" | "rounded"> & {
  columns?: number;
  compact?: boolean;
}) {
  const paddingClasses = compact ? "px-3 py-2" : "px-3 py-3";

  return (
    <tr className="border-t border-line/60">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className={clsx(paddingClasses, "text-sm")}>
          <Skeleton width="w-full" height="h-4" rounded="lg" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Complete skeleton table component with multiple rows.
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  compact = false,
  className,
}: SkeletonTableProps) {
  return (
    <div
      className={twMerge(
        clsx("overflow-x-auto rounded-lg border border-line/60 bg-card shadow-xs"),
        className
      )}
    >
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-card z-10 border-b border-line/60 text-xs uppercase tracking-wide text-ink-muted font-medium">
          <tr>
            {Array.from({ length: columns }).map((_, idx) => (
              <th key={idx} className={compact ? "px-3 py-2" : "px-3 py-3"}>
                <Skeleton width="w-full" height="h-3" rounded="lg" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <SkeletonTableRow
              key={rowIdx}
              columns={columns}
              compact={compact}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
