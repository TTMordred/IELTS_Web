import { createClient } from "@/lib/supabase/server";

const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Check if AI features are enabled (admin toggle).
 * Reads from app_settings table. Returns false if table doesn't exist or AI is off.
 */
export async function isAIEnabled(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ai_enabled")
      .single();

    return data?.value === "true";
  } catch {
    // Fail closed — if settings check fails, disable AI to protect budget
    return false;
  }
}

/**
 * Get the AI model selected by admin. Falls back to gemini-1.5-flash.
 */
export async function getAIModel(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ai_model")
      .single();

    return data?.value || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}
