"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateAISetting } from "@/app/admin/settings/actions";
import { Bot, Power, Gauge, Sparkles } from "lucide-react";

export function AISettingsForm({
  initialSettings,
}: {
  initialSettings: Record<string, string>;
}) {
  const [aiEnabled, setAiEnabled] = useState(initialSettings.ai_enabled === "true");
  const [model, setModel] = useState(initialSettings.ai_model || "gemini-2.5-flash");
  const [dailyLimit, setDailyLimit] = useState(initialSettings.ai_daily_limit_per_user || "20");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all([
        updateAISetting("ai_enabled", String(aiEnabled)),
        updateAISetting("ai_model", model),
        updateAISetting("ai_daily_limit_per_user", dailyLimit),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* AI Toggle */}
      <div className="card-base p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Power className="w-5 h-5 text-[var(--color-accent)]" />
            <div>
              <p className="font-medium text-[var(--color-ink)]">AI Features</p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                When off, AI grading and feedback are disabled for all users
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer ${
              aiEnabled ? "bg-[var(--color-accent)]" : "bg-[var(--color-line)]"
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                aiEnabled ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Model Selection */}
      <div className="card-base p-5">
        <div className="flex items-center gap-3 mb-3">
          <Bot className="w-5 h-5 text-[var(--color-accent)]" />
          <div>
            <p className="font-medium text-[var(--color-ink)]">AI Model</p>
            <p className="text-xs text-[var(--color-ink-muted)]">Choose cost vs quality tradeoff</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Fast & cheap (~$0.15/1M tokens)", icon: "⚡" },
            { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", desc: "Higher quality (~$1.25/1M tokens)", icon: "🎯" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                model === m.id
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                  : "border-[var(--color-line)] hover:border-[var(--color-accent)]/50"
              }`}
            >
              <p className="text-sm font-medium text-[var(--color-ink)]">{m.icon} {m.name}</p>
              <p className="text-xs text-[var(--color-ink-muted)]">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Limit */}
      <div className="card-base p-5">
        <div className="flex items-center gap-3 mb-3">
          <Gauge className="w-5 h-5 text-[var(--color-accent)]" />
          <div>
            <p className="font-medium text-[var(--color-ink)]">Daily Limit per User</p>
            <p className="text-xs text-[var(--color-ink-muted)]">Max AI requests per user per day</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={100}
            value={dailyLimit}
            onChange={(e) => setDailyLimit(e.target.value)}
            className="w-20 px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] font-mono text-center"
          />
          <span className="text-sm text-[var(--color-ink-muted)]">requests / day</span>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} variant="primary" loading={saving}>
          <Sparkles className="w-4 h-4" /> Save Settings
        </Button>
        {saved && (
          <span className="text-sm text-[var(--color-accent)] animate-fade-in">Settings saved!</span>
        )}
      </div>
    </div>
  );
}
