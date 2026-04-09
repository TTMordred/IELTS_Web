"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

type ThemeMode = "light" | "dark" | "system";

function applyTheme(mode: ThemeMode) {
  if (mode === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  } else {
    document.documentElement.setAttribute("data-theme", mode);
  }
  localStorage.setItem("ui-theme", mode);
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    const stored = localStorage.getItem("ui-theme");
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
    return "light";
  });

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  const cycleTheme = () => {
    const next: ThemeMode = mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
    setMode(next);
  };

  const icons = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="flex items-center justify-center h-8 w-8 rounded-lg shadow-xs hover:shadow-md transition-all duration-200 text-ink-secondary hover:text-accent"
      title={`Theme: ${mode}`}
    >
      {icons[mode]}
    </button>
  );
}
