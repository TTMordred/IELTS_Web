"use client";

import { ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface DataTableColumn<T> {
  /** Unique key for this column */
  key: string;
  /** Column header label */
  label: string;
  /** Optional CSS width (e.g., "200px", "30%") */
  width?: string;
  /** Optional custom render function */
  render?: (row: T, index: number) => ReactNode;
  /** Align content in column */
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T extends { id?: string }> {
  /** Array of column definitions */
  columns: DataTableColumn<T>[];
  /** Array of data rows to display */
  data: T[];
  /** Message to show when data is empty */
  emptyMessage?: string;
  /** Callback when a row is clicked */
  onRowClick?: (row: T, index: number) => void;
  /** Show loading skeleton state */
  loading?: boolean;
  /** Use compact row height (40px vs 48px) */
  compact?: boolean;
  /** Currently selected row (by index) */
  selectedRowIndex?: number;
  /** Additional CSS classes for the table wrapper */
  className?: string;
}

/**
 * Generic data table component that replaces duplicated table implementations.
 * Supports custom rendering, row selection, loading states, and compact mode.
 * Features sticky headers, hover effects, and empty state messaging.
 */
export function DataTable<T extends { id?: string }>({
  columns,
  data,
  emptyMessage = "No data available",
  onRowClick,
  loading = false,
  compact = false,
  selectedRowIndex,
  className,
}: DataTableProps<T>) {
  const rowHeight = compact ? "h-10" : "h-12";
  const paddingClasses = compact ? "px-3 py-2" : "px-3 py-3";

  const headerClasses =
    "sticky top-0 bg-elevated/80 z-10 border-b border-line/40 text-xs uppercase tracking-wider text-ink-muted font-semibold";
  const tableClasses =
    "w-full text-left text-sm border-collapse overflow-hidden";
  const wrapperClasses =
    "overflow-x-auto rounded-xl border border-line/60 bg-card shadow-card";

  return (
    <div className={twMerge(wrapperClasses, className)}>
      <table className={tableClasses}>
        <thead className={headerClasses}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={clsx(
                  paddingClasses,
                  column.width && `w-[${column.width}]`,
                  column.align === "center" && "text-center",
                  column.align === "right" && "text-right"
                )}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, rowIdx) => (
              <tr key={`skeleton-${rowIdx}`} className="border-t border-line/40">
                {columns.map((column) => (
                  <td
                    key={`${column.key}-skeleton`}
                    className={clsx(paddingClasses, rowHeight)}
                  >
                    <div className="h-4 bg-line/60 rounded-lg animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className={clsx(
                  "text-center text-ink-muted py-8",
                  paddingClasses
                )}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick?.(row, rowIdx)}
                className={clsx(
                  "border-t border-line/40 transition-colors duration-200 hover:bg-surface-hover/60",
                  onRowClick && "cursor-pointer",
                  selectedRowIndex === rowIdx && "bg-blue-500/15"
                )}
              >
                {columns.map((column) => (
                  <td
                    key={`${column.key}-${rowIdx}`}
                    className={clsx(
                      paddingClasses,
                      rowHeight,
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right"
                    )}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.render
                      ? column.render(row, rowIdx)
                      : (row[column.key as keyof T] as ReactNode) || "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
