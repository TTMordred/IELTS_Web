"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { logStudyTime } from "@/app/(app)/timer/actions";
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Timer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type TimerState = "idle" | "running" | "paused" | "break";

type PersistedTimer = {
  state: TimerState;
  secondsLeft: number;
  module: string;
  workDuration: number;
  breakDuration: number;
  sessionStart: number | null;
  accumulatedSeconds: number;
};

const STORAGE_KEY = "ielts-study-timer";

const MODULE_OPTIONS = [
  { value: "listening", label: "Listening" },
  { value: "reading", label: "Reading" },
  { value: "speaking", label: "Speaking" },
  { value: "writing", label: "Writing" },
  { value: "vocab", label: "Vocab" },
  { value: "grammar", label: "Grammar" },
];

const MODULE_COLORS: Record<string, string> = {
  listening: "#378ADD",
  reading: "#D85A30",
  speaking: "#1D9E75",
  writing: "#993556",
  vocab: "#7C5CDB",
  grammar: "#2A9D8F",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

function loadPersisted(): PersistedTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedTimer;
    // If timer was running, calculate elapsed time since last save
    if (data.state === "running" && data.sessionStart) {
      const elapsed = Math.floor((Date.now() - data.sessionStart) / 1000);
      const remaining = Math.max(0, data.secondsLeft - elapsed);
      return { ...data, secondsLeft: remaining };
    }
    return data;
  } catch {
    return null;
  }
}

function savePersisted(data: PersistedTimer) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function clearPersisted() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function StudyTimer() {
  const [collapsed, setCollapsed] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [module, setModule] = useState("listening");
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const workDurationRef = useRef(workDuration);
  const breakDurationRef = useRef(breakDuration);
  const accumulatedSecondsRef = useRef(accumulatedSeconds);
  const timerStateRef = useRef(timerState);

  // Keep refs in sync
  useEffect(() => { workDurationRef.current = workDuration; }, [workDuration]);
  useEffect(() => { breakDurationRef.current = breakDuration; }, [breakDuration]);
  useEffect(() => { accumulatedSecondsRef.current = accumulatedSeconds; }, [accumulatedSeconds]);
  useEffect(() => { timerStateRef.current = timerState; }, [timerState]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadPersisted();
    if (saved) {
      setTimerState(saved.state);
      setModule(saved.module);
      setWorkDuration(saved.workDuration);
      setBreakDuration(saved.breakDuration);
      setSecondsLeft(saved.secondsLeft);
      setAccumulatedSeconds(saved.accumulatedSeconds);
      if (saved.state === "running") {
        sessionStartRef.current = Date.now();
        setCollapsed(false);
      }
    }
    setInitialized(true);
  }, []);

  // Persist state whenever it changes
  useEffect(() => {
    if (!initialized) return;
    savePersisted({
      state: timerState,
      secondsLeft,
      module,
      workDuration,
      breakDuration,
      sessionStart: timerState === "running" ? (sessionStartRef.current ?? Date.now()) : null,
      accumulatedSeconds,
    });
  }, [timerState, secondsLeft, module, workDuration, breakDuration, accumulatedSeconds, initialized]);

  const handleComplete = useCallback(
    async (state: TimerState, totalSeconds: number) => {
      const minutes = Math.round(totalSeconds / 60);
      if (minutes > 0 && state !== "break") {
        try {
          await logStudyTime(module, minutes);
        } catch {
          // ignore
        }
      }
    },
    [module]
  );

  // Tick
  useEffect(() => {
    if (timerState !== "running") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          const currentState = timerStateRef.current;
          const finishedWork = currentState === "running";
          if (finishedWork) {
            const totalAcc = accumulatedSecondsRef.current + workDurationRef.current * 60;
            handleComplete("running", totalAcc);
            setAccumulatedSeconds(0);
            accumulatedSecondsRef.current = 0;
            setTimerState("break");
            timerStateRef.current = "break";
            return breakDurationRef.current * 60;
          } else {
            // Break finished → go idle
            setTimerState("idle");
            timerStateRef.current = "idle";
            return workDurationRef.current * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState]);

  function handleStart() {
    sessionStartRef.current = Date.now();
    setTimerState("running");
    setCollapsed(false);
  }

  function handlePause() {
    const elapsed = sessionStartRef.current
      ? Math.floor((Date.now() - sessionStartRef.current) / 1000)
      : 0;
    setAccumulatedSeconds((prev) => prev + elapsed);
    sessionStartRef.current = null;
    setTimerState("paused");
  }

  function handleResume() {
    sessionStartRef.current = Date.now();
    setTimerState("running");
  }

  function handleReset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState("idle");
    setSecondsLeft(workDuration * 60);
    setAccumulatedSeconds(0);
    sessionStartRef.current = null;
  }

  async function handleStop() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const elapsed = sessionStartRef.current
      ? Math.floor((Date.now() - sessionStartRef.current) / 1000)
      : 0;
    const total = accumulatedSeconds + elapsed;
    if (total > 30 && timerState !== "break") {
      await handleComplete("running", total);
    }
    setTimerState("idle");
    setSecondsLeft(workDuration * 60);
    setAccumulatedSeconds(0);
    sessionStartRef.current = null;
    clearPersisted();
  }

  if (!initialized) return null;

  const isIdle = timerState === "idle";
  const isRunning = timerState === "running";
  const isPaused = timerState === "paused";
  const isBreak = timerState === "break";
  const accentColor = MODULE_COLORS[module] || "var(--color-accent)";
  const totalSeconds = isBreak ? breakDuration * 60 : workDuration * 60;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-0">
      {/* Expanded panel */}
      {!collapsed && (
        <div
          className="mb-2 w-64 rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] shadow-[var(--shadow-xl)] overflow-hidden animate-fade-in-up"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-line)]"
            style={{ borderTop: `3px solid ${accentColor}` }}
          >
            <span className="text-xs font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wider">
              {isBreak ? "Break" : "Study Timer"}
            </span>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)] cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Timer display */}
          <div className="px-4 pt-4 pb-3 flex flex-col items-center gap-3">
            {/* Progress ring */}
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="var(--color-line)"
                  strokeWidth="8"
                />
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-mono font-bold text-[var(--color-ink)]">
                  {formatTime(secondsLeft)}
                </span>
                <span className="text-[10px] text-[var(--color-ink-muted)] mt-0.5">
                  {isBreak ? "break" : isIdle ? "ready" : isRunning ? "focus" : "paused"}
                </span>
              </div>
            </div>

            {/* Module selector (only when idle) */}
            {isIdle && (
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-body)] text-[var(--color-ink)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              >
                {MODULE_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            )}

            {/* Module label when active */}
            {!isIdle && (
              <span className="text-xs font-medium" style={{ color: accentColor }}>
                {MODULE_OPTIONS.find((m) => m.value === module)?.label || module}
              </span>
            )}

            {/* Duration config (only idle) */}
            {isIdle && (
              <div className="flex gap-3 w-full">
                <div className="flex-1">
                  <label className="block text-[10px] text-[var(--color-ink-muted)] mb-0.5 text-center">Work (min)</label>
                  <input
                    type="number"
                    min={1} max={60}
                    value={workDuration}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(60, Number(e.target.value)));
                      setWorkDuration(v);
                      setSecondsLeft(v * 60);
                    }}
                    className="w-full px-2 py-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-body)] text-[var(--color-ink)] text-xs text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] text-[var(--color-ink-muted)] mb-0.5 text-center">Break (min)</label>
                  <input
                    type="number"
                    min={1} max={30}
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(Math.max(1, Math.min(30, Number(e.target.value))))}
                    className="w-full px-2 py-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-body)] text-[var(--color-ink)] text-xs text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2">
              {isIdle && (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-all cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  <Play className="w-3.5 h-3.5" /> Start
                </button>
              )}
              {isRunning && (
                <>
                  <button
                    onClick={handlePause}
                    className="p-2 rounded-lg border border-[var(--color-line)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
                    title="Pause"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleStop}
                    className="p-2 rounded-lg border border-[var(--color-line)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
                    title="Stop & log"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </>
              )}
              {isPaused && (
                <>
                  <button
                    onClick={handleResume}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white cursor-pointer"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Play className="w-3.5 h-3.5" /> Resume
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2 rounded-lg border border-[var(--color-line)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
                    title="Reset"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleStop}
                    className="p-2 rounded-lg border border-[var(--color-line)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
                    title="Stop & log"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </>
              )}
              {isBreak && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-line)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Skip Break
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mini FAB — always visible */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-[var(--color-line)] bg-[var(--color-card)] shadow-[var(--shadow-lg)] text-sm font-medium text-[var(--color-ink)] hover:shadow-[var(--shadow-xl)] transition-all cursor-pointer"
        style={!isIdle ? { borderColor: accentColor } : undefined}
      >
        <Timer className="w-4 h-4" style={!isIdle ? { color: accentColor } : { color: "var(--color-ink-muted)" }} />
        <span className="font-mono text-xs" style={!isIdle ? { color: accentColor } : undefined}>
          {formatTime(secondsLeft)}
        </span>
        {collapsed ? (
          <ChevronUp className="w-3 h-3 text-[var(--color-ink-muted)]" />
        ) : (
          <ChevronDown className="w-3 h-3 text-[var(--color-ink-muted)]" />
        )}
      </button>
    </div>
  );
}
