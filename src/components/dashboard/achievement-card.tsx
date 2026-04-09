"use client";

import { useState } from "react";
import {
  Flame,
  TrendingUp,
  Trophy,
  BookMarked,
  Headphones,
  BookOpen,
  Target,
  Brain,
  Map,
  Share2,
  Copy,
  Check,
} from "lucide-react";

export type AchievementType =
  | "band_reached"
  | "streak_record"
  | "badge_earned"
  | "level_up";

type AchievementCardProps = {
  type: AchievementType;
  value: string | number;
  username: string;
  module?: string;
  badgeIcon?: string;
  date?: string;
};

const MODULE_COLORS: Record<string, string> = {
  Listening: "#378ADD",
  Reading: "#D85A30",
  Speaking: "#1D9E75",
  Writing: "#993556",
};

const BADGE_ICON_MAP: Record<string, React.ReactNode> = {
  target: <Target className="w-6 h-6" />,
  flame: <Flame className="w-6 h-6" />,
  "book-marked": <BookMarked className="w-6 h-6" />,
  headphones: <Headphones className="w-6 h-6" />,
  "book-open": <BookOpen className="w-6 h-6" />,
  "trending-up": <TrendingUp className="w-6 h-6" />,
  trophy: <Trophy className="w-6 h-6" />,
  brain: <Brain className="w-6 h-6" />,
  map: <Map className="w-6 h-6" />,
};

function getAchievementContent(
  type: AchievementType,
  value: string | number,
  module?: string,
): { title: string; subtitle: string; icon: React.ReactNode; color: string } {
  const moduleColor = module ? MODULE_COLORS[module] ?? "#1B4D3E" : "#1B4D3E";

  switch (type) {
    case "band_reached":
      return {
        title: `Band ${value} Reached!`,
        subtitle: module ? `${module} module` : "Overall IELTS",
        icon: <TrendingUp className="w-6 h-6" />,
        color: moduleColor,
      };
    case "streak_record":
      return {
        title: `${value}-Day Streak!`,
        subtitle: "Consistent daily study",
        icon: <Flame className="w-6 h-6" />,
        color: "#F97316",
      };
    case "badge_earned":
      return {
        title: `${value}`,
        subtitle: "Badge unlocked",
        icon: <Trophy className="w-6 h-6" />,
        color: "#EAB308",
      };
    case "level_up":
      return {
        title: `Level ${value} Reached!`,
        subtitle: "Keep up the momentum",
        icon: <TrendingUp className="w-6 h-6" />,
        color: "#1B4D3E",
      };
  }
}

function buildShareText(
  type: AchievementType,
  value: string | number,
  username: string,
  module?: string,
): string {
  switch (type) {
    case "band_reached":
      return `I just reached Band ${value}${module ? ` in ${module}` : ""} on IELTS Hub! 🎯 — @${username} | ielts-hub.app`;
    case "streak_record":
      return `${value}-day study streak on IELTS Hub! 🔥 Consistency is key. — @${username} | ielts-hub.app`;
    case "badge_earned":
      return `I earned the "${value}" badge on IELTS Hub! 🏆 — @${username} | ielts-hub.app`;
    case "level_up":
      return `Just hit Level ${value} on IELTS Hub! 📈 — @${username} | ielts-hub.app`;
  }
}

export function AchievementCard({
  type,
  value,
  username,
  module,
  badgeIcon,
  date,
}: AchievementCardProps) {
  const [copied, setCopied] = useState(false);

  const { title, subtitle, icon: defaultIcon, color } = getAchievementContent(type, value, module);
  const displayIcon = badgeIcon && BADGE_ICON_MAP[badgeIcon] ? BADGE_ICON_MAP[badgeIcon] : defaultIcon;
  const shareText = buildShareText(type, value, username, module);
  const displayDate = date ?? new Date().toISOString().slice(0, 10);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: "https://ielts-hub.app" });
      } catch {
        // user cancelled — do nothing
      }
    } else {
      handleCopy();
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <div className="card-base overflow-hidden">
      {/* Branded card header */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ backgroundColor: `${color}15`, borderBottom: `2px solid ${color}30` }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: color, color: "#fff" }}
        >
          {displayIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[var(--color-ink)] leading-tight">{title}</p>
          <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--color-ink-muted)]">@{username}</p>
          <p className="text-xs text-[var(--color-ink-muted)]">{displayDate}</p>
        </div>
        <div className="text-xs font-semibold text-[var(--color-accent)] tracking-wide">
          ielts-hub.app
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-4 flex gap-2">
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-colors cursor-pointer"
          style={{ backgroundColor: color }}
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--color-surface-hover)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy text"}
        </button>
      </div>
    </div>
  );
}
