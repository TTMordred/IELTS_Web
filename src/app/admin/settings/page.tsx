import { checkIsAdmin } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { AISettingsForm } from "@/components/admin/ai-settings-form";
import { Settings } from "lucide-react";

export default async function AdminSettingsPage() {
  await checkIsAdmin();

  const supabase = await createClient();

  const settingsMap: Record<string, string> = {
    ai_enabled: "true",
    ai_model: "gemini-2.0-flash",
    ai_daily_limit_per_user: "20",
  };

  try {
    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["ai_enabled", "ai_model", "ai_daily_limit_per_user"]);

    if (settings && settings.length > 0) {
      settings.forEach((s) => {
        settingsMap[s.key] = s.value;
      });
    }
  } catch {
    // app_settings table may not exist yet — use defaults
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <Settings className="w-6 h-6 text-[var(--color-accent)]" />
          AI Settings
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Control AI features for all users
        </p>
      </div>
      <AISettingsForm initialSettings={settingsMap} />
    </div>
  );
}
