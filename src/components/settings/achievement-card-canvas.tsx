"use client";

import { useRef, useEffect, useState } from "react";
import { Download, Copy, Check } from "lucide-react";
import type { AchievementCardData } from "@/app/(app)/settings/share-actions";

const W = 1200;
const H = 630;

const MODULE_COLORS = ["#378ADD", "#D85A30", "#993556", "#1D9E75"];
const MODULE_LABELS = ["Listening", "Reading", "Writing", "Speaking"];

function drawCard(ctx: CanvasRenderingContext2D, data: AchievementCardData) {
  ctx.fillStyle = "#0D1B2A";
  ctx.fillRect(0, 0, W, H);

  const barGrad = ctx.createLinearGradient(0, 0, W, 0);
  barGrad.addColorStop(0, "#1B4D3E");
  barGrad.addColorStop(1, "#2D6A4F");
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, 0, W, 10);

  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const FONT = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

  ctx.fillStyle = "#4ADE80";
  ctx.font = `bold 18px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("IELTS Hub", 60, 70);

  ctx.fillStyle = "#1B4D3E";
  ctx.fillRect(60, 80, 80, 2);

  ctx.fillStyle = "#F1F5F9";
  ctx.font = `bold 58px ${FONT}`;
  const nameText = data.display_name.length > 22
    ? data.display_name.slice(0, 22) + "…"
    : data.display_name;
  ctx.fillText(nameText, 60, 160);

  const band = data.current_est_band;
  ctx.fillStyle = band !== null ? "#4ADE80" : "#64748B";
  ctx.font = `bold 160px ${FONT}`;
  ctx.fillText(band !== null ? band.toFixed(1) : "—", 60, 360);

  ctx.fillStyle = "#64748B";
  ctx.font = `600 18px ${FONT}`;
  ctx.letterSpacing = "3px";
  ctx.fillText("OVERALL BAND", 62, 400);
  ctx.letterSpacing = "0px";

  ctx.textAlign = "right";

  ctx.fillStyle = "#FB923C";
  ctx.font = `bold 52px ${FONT}`;
  ctx.fillText(`${data.current_streak}`, W - 60, 200);
  ctx.fillStyle = "#94A3B8";
  ctx.font = `500 17px ${FONT}`;
  ctx.fillText("DAY STREAK", W - 60, 228);

  const xpDisplay = data.total_xp >= 1000
    ? `${(data.total_xp / 1000).toFixed(1)}k`
    : String(data.total_xp);
  ctx.fillStyle = "#FACC15";
  ctx.font = `bold 44px ${FONT}`;
  ctx.fillText(`${xpDisplay} XP`, W - 60, 300);
  ctx.fillStyle = "#94A3B8";
  ctx.font = `500 17px ${FONT}`;
  ctx.fillText("EXPERIENCE", W - 60, 328);

  ctx.fillStyle = "#E2E8F0";
  ctx.font = `bold 36px ${FONT}`;
  ctx.fillText(`Level ${data.level}`, W - 60, 390);
  ctx.fillStyle = "#94A3B8";
  ctx.font = `500 17px ${FONT}`;
  ctx.fillText(data.level_title.toUpperCase(), W - 60, 415);

  const rowY = 470;
  const colW = W / 4;

  ctx.fillStyle = "#1E3A5F";
  ctx.fillRect(0, rowY - 20, W, 1);

  const moduleAvgs = [
    data.listening_avg,
    data.reading_avg,
    data.writing_avg,
    data.speaking_avg,
  ];

  MODULE_LABELS.forEach((label, i) => {
    const cx = i * colW + colW / 2;
    const avg = moduleAvgs[i];
    const color = MODULE_COLORS[i];

    ctx.fillStyle = color;
    ctx.fillRect(i * colW + 30, rowY - 20, colW - 60, 3);

    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.font = `bold 44px ${FONT}`;
    ctx.fillText(avg !== null ? avg.toFixed(1) : "—", cx, rowY + 52);

    ctx.fillStyle = "#94A3B8";
    ctx.font = `500 16px ${FONT}`;
    ctx.fillText(label.toUpperCase(), cx, rowY + 80);
  });

  ctx.textAlign = "right";
  ctx.fillStyle = "#1E3A5F";
  ctx.font = `400 13px ${FONT}`;
  ctx.fillText("ielts-hub.app", W - 30, H - 18);
}

export function AchievementCardCanvas({ data }: { data: AchievementCardData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCard(ctx, data);
  }, [data]);

  function getBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) return reject(new Error("Canvas not ready"));
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Failed to create image"));
        resolve(blob);
      }, "image/png");
    });
  }

  async function handleDownload() {
    const blob = await getBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ielts-achievement.png";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    setCopyError(null);
    try {
      const blob = await getBlob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch {
      setCopyError("Clipboard not available in this browser.");
      setTimeout(() => setCopyError(null), 3000);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden border border-[var(--color-line)] shadow-md">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download PNG
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--color-line)] text-[var(--color-ink)] rounded-lg text-sm font-medium hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
        >
          {copying ? (
            <><Check className="w-4 h-4 text-emerald-500" /> Copied!</>
          ) : (
            <><Copy className="w-4 h-4" /> Copy to clipboard</>
          )}
        </button>

        {copyError && (
          <p className="text-xs text-[var(--color-critical)]">{copyError}</p>
        )}
      </div>

      <p className="text-xs text-[var(--color-ink-muted)]">
        1200 × 630 px · PNG · Share on social media or with your study group
      </p>
    </div>
  );
}
