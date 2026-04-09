"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { CommandPalette } from "@/components/layout/command-palette";
import { StudyTimer } from "@/components/layout/study-timer";
import { FocusModeToggle, useFocusMode } from "@/components/layout/focus-mode";
import { DashboardToggles } from "@/components/dashboard/dashboard-toggles";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { focused, toggle } = useFocusMode();
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-body)]">
      {!focused && <Sidebar />}

      <main className="flex-1 overflow-y-auto">
        {!focused && (
          <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-[var(--color-body)]/80 backdrop-blur-sm border-b border-[var(--color-line)]">
            <div className="flex items-center gap-3">
              <span className="heading-sm text-accent hidden sm:block">IELTS Hub</span>
            </div>
            <div className="flex items-center gap-3">
              {isDashboard && <DashboardToggles />}
              <NotificationBell />
              <FocusModeToggle focused={focused} toggle={toggle} />
              <ThemeToggle />
            </div>
          </header>
        )}

        {focused && (
          <div className="fixed top-3 right-3 z-50">
            <FocusModeToggle focused={focused} toggle={toggle} />
          </div>
        )}

        <div className={focused ? "p-4" : "p-6"}>
          {children}
        </div>
      </main>

      {!focused && <MobileNav />}
      <CommandPalette />
      <StudyTimer />
    </div>
  );
}
