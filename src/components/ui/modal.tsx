"use client";

import {
  ReactNode,
  useEffect,
  useRef,
  useCallback,
  MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { X } from "lucide-react";

type ModalSize = "sm" | "md" | "lg";

export interface ModalProps {
  /** Show/hide the modal */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: ReactNode;
  /** Modal size (sm: 400px, md: 560px, lg: 720px) */
  size?: ModalSize;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Close modal on backdrop click */
  closeOnBackdropClick?: boolean;
}

export interface ModalHeaderProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export interface ModalContentProps {
  children: ReactNode;
  className?: string;
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * Dialog/modal component with backdrop, focus trap, and keyboard handling.
 * Supports multiple sizes and smooth enter/exit transitions.
 * Uses React portal to render outside the DOM hierarchy.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnBackdropClick = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!open || !modalRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }

      // Focus trap
      if (e.key === "Tab") {
        const focusableElements = contentRef.current?.querySelectorAll(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;
        const activeElement = document.activeElement;

        if (e.shiftKey) {
          if (activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  const handleBackdropClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose, closeOnBackdropClick]
  );

  const sizeClasses = {
    sm: "w-full max-w-sm",
    md: "w-full max-w-[560px]",
    lg: "w-full max-w-[720px]",
  };

  if (!open) return null;

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
      role="presentation"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200" />

      {/* Modal content */}
      <div
        ref={contentRef}
        className={clsx(
          "relative z-10 bg-card rounded-xl border border-line/60 shadow-xl mx-4 animate-scale-in",
          sizeClasses[size]
        )}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-line/60">
            <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-surface-hover transition-all duration-150"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5 text-ink-muted hover:text-ink" />
              </button>
            )}
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Modal header sub-component.
 */
export function ModalHeader({
  children,
  onClose,
  className,
}: ModalHeaderProps) {
  return (
    <div
      className={twMerge(
        clsx("flex items-center justify-between px-6 py-4 border-b border-line/60"),
        className
      )}
    >
      <div>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-surface-hover transition-all duration-150"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5 text-ink-muted hover:text-ink" />
        </button>
      )}
    </div>
  );
}

/**
 * Modal content sub-component.
 */
export function ModalContent({ children, className }: ModalContentProps) {
  return <div className={twMerge("px-6 py-4", className)}>{children}</div>;
}

/**
 * Modal footer sub-component for action buttons.
 */
export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "flex items-center justify-end gap-3 px-6 py-4 border-t border-line/60 bg-surface-hover"
        ),
        className
      )}
    >
      {children}
    </div>
  );
}
