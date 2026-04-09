"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getResources(filters?: {
  module?: string;
  search?: string;
  showPublic?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.module && filters.module !== "all") {
    query = query.eq("module", filters.module);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,url.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
  }
  if (!filters?.showPublic) {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function addResource(input: {
  url: string;
  title: string;
  module: string;
  difficulty: string;
  tags: string[];
  notes: string;
  is_public: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("resources").insert({
    user_id: user.id,
    url: input.url,
    title: input.title,
    module: input.module || "general",
    difficulty: input.difficulty || "all",
    tags: input.tags.filter(Boolean),
    notes: input.notes || null,
    is_public: input.is_public,
  });

  if (error) throw error;
  revalidatePath("/resources");
}

export async function deleteResource(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/resources");
}

export async function incrementUsage(id: string) {
  const supabase = await createClient();
  const { data: resource } = await supabase
    .from("resources")
    .select("usage_count")
    .eq("id", id)
    .single();

  if (resource) {
    await supabase
      .from("resources")
      .update({ usage_count: resource.usage_count + 1 })
      .eq("id", id);
  }
}
