"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Headphones,
  BookOpen,
  MessageSquare,
  PenTool,
  BarChart3,
  BookMarked,
  Library,
  Link2,
  AlertTriangle,
  HelpCircle,
  Settings,
  CalendarDays,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    label: "Listening",
    href: "/listening",
    icon: Headphones,
    enabled: true,
    color: "#378ADD",
  },
  {
    label: "Reading",
    href: "/reading",
    icon: BookOpen,
    enabled: true,
    color: "#D85A30",
  },
  {
    label: "Speaking",
    href: "/speaking",
    icon: MessageSquare,
    enabled: true,
    color: "#1D9E75",
  },
  {
    label: "Writing",
    href: "/writing",
    icon: PenTool,
    enabled: true,
    color: "#993556",
  },
  { type: "divider" as const },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    enabled: true,
  },
  {
    label: "Activity",
    href: "/activity",
    icon: Activity,
    enabled: true,
  },
  {
    label: "Vocab Bank",
    href: "/vocab",
    icon: BookMarked,
    enabled: true,
  },
  {
    label: "Grammar",
    href: "/grammar",
    icon: BookOpen,
    enabled: true,
  },
  {
    label: "Topics",
    href: "/topics",
    icon: Library,
    enabled: true,
  },
  {
    label: "Resources",
    href: "/resources",
    icon: Link2,
    enabled: true,
  },
  {
    label: "Mistakes",
    href: "/mistakes",
    icon: AlertTriangle,
    enabled: true,
  },
  {
    label: "Planner",
    href: "/planner",
    icon: CalendarDays,
    enabled: true,
  },
  {
    label: "Wiki",
    href: "/wiki",
    icon: HelpCircle,
    enabled: true,
  },
  { type: "divider" as const },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    enabled: false,
  },
];

type NavItemLink = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  color?: string;
};

// Divider items have { type: "divider" }, link items have label/href/icon/enabled

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-[var(--color-line)] bg-[var(--color-sidebar)] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--color-line)]">
        <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
          <span className="text-white text-xs font-bold">I</span>
        </div>
        <span className="heading-sm">IELTS Hub</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item, i) => {
          if ("type" in item && item.type === "divider") {
            return <div key={i} className="my-3 border-t border-[var(--color-line-light)]" />;
          }

          const link = item as NavItemLink;
          const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
          const Icon = link.icon;

          if (!link.enabled) {
            return (
              <div
                key={link.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--color-ink-muted)] opacity-50 cursor-not-allowed"
              >
                <Icon className="w-4.5 h-4.5" />
                <span className="text-sm">{link.label}</span>
                <span className="ml-auto text-[0.6rem] uppercase tracking-wider opacity-60">Soon</span>
              </div>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                isActive
                  ? "nav-active"
                  : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)]"
              )}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
