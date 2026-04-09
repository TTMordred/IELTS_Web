"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Headphones,
  BookMarked,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Listening", href: "/listening", icon: Headphones },
  { label: "Vocab", href: "/vocab", icon: BookMarked },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-card)] border-t border-[var(--color-line)] px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 px-3 text-xs transition-colors cursor-pointer",
                isActive
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-ink-muted)]"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
