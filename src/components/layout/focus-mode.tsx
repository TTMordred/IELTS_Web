"use client";

import { useState, useEffect, useCallback } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export function useFocusMode() {
  const [focused, setFocused] = useState(false);

  const toggle = useCallback(() => setFocused((prev) => !prev), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return { focused, toggle };
}

export function FocusModeToggle({ focused, toggle }: { focused: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)] transition-colors cursor-pointer"
      title={focused ? "Exit Focus Mode (Cmd+Shift+F)" : "Focus Mode (Cmd+Shift+F)"}
    >
      {focused ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
    </button>
  );
}
