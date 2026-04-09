"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Square, RotateCcw } from "lucide-react";

type Props = {
  maxSeconds?: number;
  onRecorded: (blob: Blob, mimeType: string) => void;
  onCleared: () => void;
  disabled?: boolean;
};

type RecorderState = "idle" | "recording" | "recorded";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SpeakingRecorder({
  maxSeconds = 180,
  onRecorded,
  onCleared,
  disabled = false,
}: Props) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && !!window.MediaRecorder);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      stopStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRecording() {
    setPermissionError(null);
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPermissionError("Microphone access denied. Please allow microphone access and try again.");
      return;
    }

    streamRef.current = stream;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setState("recorded");
      onRecorded(blob, mimeType);
      stopStream();
    };

    recorder.start(100);
    setState("recording");
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= maxSeconds) {
          stopRecording();
          return maxSeconds;
        }
        return prev + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  function handleReRecord() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setState("idle");
    setElapsed(0);
    setPermissionError(null);
    onCleared();
  }

  if (supported === false) {
    return (
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-ink-muted)]">
        Recording not supported in this browser. Please use a modern browser like Chrome or Firefox.
      </div>
    );
  }

  if (supported === null) return null;

  return (
    <div className="space-y-3">
      {permissionError && (
        <p className="text-sm text-[var(--color-critical)] bg-red-500/10 rounded-md px-3 py-2">
          {permissionError}
        </p>
      )}

      {state === "idle" && (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mic className="w-4 h-4" style={{ color: "#1D9E75" }} />
          Start Recording
        </button>
      )}

      {state === "recording" && (
        <div className="flex items-center gap-4">
          {/* Pulsing red dot */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-sm font-mono font-medium text-[var(--color-ink)]">
            {formatTime(elapsed)}
            <span className="text-[var(--color-ink-muted)] ml-1">
              / {formatTime(maxSeconds)}
            </span>
          </span>
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-red-500 text-white hover:bg-red-600"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </button>
        </div>
      )}

      {state === "recorded" && audioUrl && (
        <div className="space-y-2">
          <audio controls src={audioUrl} className="w-full h-10" />
          <button
            type="button"
            onClick={handleReRecord}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Re-record
          </button>
        </div>
      )}
    </div>
  );
}
