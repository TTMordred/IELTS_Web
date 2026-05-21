"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, User, ChevronDown } from "lucide-react";
import { logout } from "@/app/(app)/auth-actions";
import type { User as AuthUser } from "@supabase/supabase-js";

interface UserMenuProps {
  user: AuthUser | null;
  profile?: { display_name?: string };
}

export function UserMenu({ user, profile }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (!user) return null;

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";
  const userInitials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoading(false);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-[var(--color-surface-hover)] cursor-pointer"
        disabled={isLoading}
      >
        <div className="w-7 h-7 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-xs font-semibold">
          {userInitials}
        </div>
        <span className="hidden sm:inline text-[var(--color-ink-secondary)]">{displayName}</span>
        <ChevronDown className="w-4 h-4 text-[var(--color-ink-muted)]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 card-base shadow-lg rounded-lg overflow-hidden z-50 animate-fade-in">
          {/* User info section */}
          <div className="px-4 py-3 border-b border-[var(--color-line)] bg-[var(--color-surface-hover)]">
            <p className="text-sm font-medium text-[var(--color-ink)]">{displayName}</p>
            <p className="text-xs text-[var(--color-ink-muted)] truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-2">
            <a
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
            >
              <User className="w-4 h-4" />
              Settings
            </a>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-critical)] hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {isLoading ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
