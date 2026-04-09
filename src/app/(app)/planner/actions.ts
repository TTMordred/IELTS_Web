"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type PlanItem = {
  id: string;
  user_id: string;
  date: string;
  time_slot: "morning" | "afternoon" | "evening";
  module: "listening" | "reading" | "speaking" | "writing" | "vocab" | "grammar" | null;
  topic: string | null;
  duration_min: number;
  completed: boolean;
  created_at: string;
};

export type AddPlanItemInput = {
  date: string;
  time_slot: "morning" | "afternoon" | "evening";
  module: "listening" | "reading" | "speaking" | "writing" | "vocab" | "grammar";
  topic?: string;
  duration_min?: number;
};

export async function getWeekPlan(weekStart: string): Promise<PlanItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Calculate end date (7 days from weekStart)
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const weekEnd = end.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("study_plan_items")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .order("date", { ascending: true });

  if (error) throw error;
  return (data || []) as PlanItem[];
}

export async function addPlanItem(input: AddPlanItemInput): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("study_plan_items").insert({
    user_id: user.id,
    date: input.date,
    time_slot: input.time_slot,
    module: input.module,
    topic: input.topic || null,
    duration_min: input.duration_min ?? 30,
  });

  if (error) throw error;
  revalidatePath("/planner");
}

export async function togglePlanItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: item, error: fetchError } = await supabase
    .from("study_plan_items")
    .select("completed")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from("study_plan_items")
    .update({ completed: !item.completed })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/planner");
}

export async function deletePlanItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("study_plan_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/planner");
}
