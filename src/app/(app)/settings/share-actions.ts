"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ShareLink = {
  id: string;
  token: string;
  expires_at: string;
  created_at: string;
  view_config: {
    modules: string[];
    showHeatmap: boolean;
    showTrends: boolean;
    snapshot?: {
      display_name: string;
      target_band: number | null;
      current_est_band: number | null;
      current_streak: number;
      listening_avg: number | null;
      reading_avg: number | null;
      writing_avg: number | null;
      speaking_avg: number | null;
      listening_count: number;
      reading_count: number;
      writing_count: number;
      speaking_count: number;
    };
  };
};

export async function createShareLink(): Promise<ShareLink> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Build snapshot of aggregated stats
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, target_band, current_est_band, current_streak"
    )
    .eq("id", user.id)
    .single();

  // Per-module aggregates from records
  const [listening, reading, writing, speaking] = await Promise.all([
    supabase
      .from("listening_records")
      .select("estimated_band")
      .eq("user_id", user.id),
    supabase
      .from("reading_records")
      .select("estimated_band")
      .eq("user_id", user.id),
    supabase
      .from("writing_submissions")
      .select("estimated_band")
      .eq("user_id", user.id),
    supabase
      .from("speaking_records")
      .select("estimated_band")
      .eq("user_id", user.id),
  ]);

  function avg(rows: { estimated_band: number | null }[] | null): number | null {
    if (!rows || rows.length === 0) return null;
    const valid = rows.filter((r) => r.estimated_band !== null);
    if (valid.length === 0) return null;
    return (
      Math.round(
        (valid.reduce((sum, r) => sum + (r.estimated_band ?? 0), 0) /
          valid.length) *
          2
      ) / 2
    );
  }

  const snapshot = {
    display_name: profile?.display_name ?? "Student",
    target_band: profile?.target_band ?? null,
    current_est_band: profile?.current_est_band ?? null,
    current_streak: profile?.current_streak ?? 0,
    listening_avg: avg(listening.data),
    reading_avg: avg(reading.data),
    writing_avg: avg(writing.data),
    speaking_avg: avg(speaking.data),
    listening_count: listening.data?.length ?? 0,
    reading_count: reading.data?.length ?? 0,
    writing_count: writing.data?.length ?? 0,
    speaking_count: speaking.data?.length ?? 0,
  };

  const { data, error } = await supabase
    .from("share_links")
    .insert({
      user_id: user.id,
      view_config: {
        modules: ["listening", "reading", "writing", "speaking"],
        showHeatmap: true,
        showTrends: true,
        snapshot,
      },
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/settings/share");
  return data as ShareLink;
}

export async function getShareLinks(): Promise<ShareLink[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("share_links")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ShareLink[];
}

export async function deleteShareLink(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("share_links")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/settings/share");
}
