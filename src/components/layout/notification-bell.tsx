"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, BookMarked, Flame, PenTool, Trophy, X, CheckCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/(app)/notifications/actions";
import type { NotificationRow } from "@/app/(app)/notifications/actions";

type ApiResponse = {
  notifications: NotificationRow[];
  unreadCount: number;
};

const TYPE_META: Record<
  NotificationRow["type"],
  { icon: React.ReactNode; color: string; href?: string }
> = {
  streak_at_risk: {
    icon: <Flame className="w-4 h-4" />,
    color: "#E85D04",
    href: "/dashboard",
  },
  vocab_review_due: {
    icon: <BookMarked className="w-4 h-4" />,
    color: "#7C3AED",
    href: "/vocab/review",
  },
  writing_reminder: {
    icon: <PenTool className="w-4 h-4" />,
    color: "#993556",
    href: "/writing/new",
  },
  achievement_unlocked: {
    icon: <Trophy className="w-4 h-4" />,
    color: "#D69E2E",
  },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef(0);
  const cachedDataRef = useRef<ApiResponse | null>(null);

  const fetchNotifications = useCallback(async () => {
    // Show cached data immediately (stale-while-revalidate)
    if (cachedDataRef.current) {
      setNotifications(cachedDataRef.current.notifications);
      setUnreadCount(cachedDataRef.current.unreadCount);
      setLoaded(true);
    }

    // Skip network if fresh enough
    if (Date.now() - lastFetchRef.current < 60_000) return;

    // Background fetch
    try {
      const res = await fetch("/api/notifications-data");
      if (!res.ok) return;
      const data: ApiResponse = await res.json();
      cachedDataRef.current = data;
      lastFetchRef.current = Date.now();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently fail — notifications are non-critical
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await markNotificationRead(id);
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
          open
            ? "bg-[var(--color-surface-hover)] text-[var(--color-ink)]"
            : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)]"
        )}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {loaded && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--color-accent)] text-white text-[0.6rem] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-line)]">
            <span className="text-sm font-semibold text-[var(--color-ink)]">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-6 h-6 text-[var(--color-ink-muted)] mx-auto mb-2" />
                <p className="text-sm text-[var(--color-ink-secondary)]">All caught up!</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--color-line-light)]">
                {notifications.map((n) => {
                  const meta = TYPE_META[n.type];
                  return (
                    <li
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-surface)] transition-colors group",
                        n.read && "opacity-50"
                      )}
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `${meta.color}18`,
                          color: meta.color,
                        }}
                      >
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--color-ink-secondary)] mb-0.5">
                          {n.title}
                        </p>
                        {meta.href ? (
                          <Link
                            href={meta.href}
                            className="text-sm text-[var(--color-ink)] hover:underline leading-snug"
                            onClick={() => setOpen(false)}
                          >
                            {n.message}
                          </Link>
                        ) : (
                          <p className="text-sm text-[var(--color-ink)] leading-snug">
                            {n.message}
                          </p>
                        )}
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="shrink-0 mt-0.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          aria-label="Mark as read"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
