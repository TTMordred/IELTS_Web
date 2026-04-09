"use server";

import { createClient } from "@/lib/supabase/server";

export type ActivityItem = {
  id: string;
  module: "listening" | "reading" | "writing" | "speaking" | "vocab" | "grammar";
  title: string;
  description: string;
  estimated_band?: number | null;
  created_at: string;
  href?: string;
};

export async function getActivityFeed(limit = 30): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [listening, reading, writing, speaking, vocab, grammar] =
    await Promise.all([
      supabase
        .from("listening_records")
        .select("id, date, test_name, estimated_band, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("reading_records")
        .select("id, date, test_name, estimated_band, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("writing_entries")
        .select("id, date, task_type, sub_type, estimated_band, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("speaking_entries")
        .select("id, date, type, estimated_band, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("vocab_cards")
        .select("id, word, meaning, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("grammar_notes")
        .select("id, category, rule, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

  const items: ActivityItem[] = [];

  for (const r of listening.data || []) {
    items.push({
      id: `listening-${r.id}`,
      module: "listening",
      title: "Listening Test",
      description: r.test_name || "Untitled test",
      estimated_band: r.estimated_band,
      created_at: r.created_at,
      href: `/listening/${r.id}`,
    });
  }

  for (const r of reading.data || []) {
    items.push({
      id: `reading-${r.id}`,
      module: "reading",
      title: "Reading Test",
      description: r.test_name || "Untitled test",
      estimated_band: r.estimated_band,
      created_at: r.created_at,
      href: `/reading/${r.id}`,
    });
  }

  for (const r of writing.data || []) {
    const label =
      r.task_type === "task1"
        ? `Task 1${r.sub_type ? ` — ${r.sub_type}` : ""}`
        : `Task 2${r.sub_type ? ` — ${r.sub_type}` : ""}`;
    items.push({
      id: `writing-${r.id}`,
      module: "writing",
      title: "Writing Entry",
      description: label,
      estimated_band: r.estimated_band,
      created_at: r.created_at,
      href: `/writing/${r.id}`,
    });
  }

  for (const r of speaking.data || []) {
    const typeLabel =
      r.type === "mock_test"
        ? "Mock Test"
        : r.type === "real_test"
          ? "Real Test"
          : "Practice";
    items.push({
      id: `speaking-${r.id}`,
      module: "speaking",
      title: "Speaking Session",
      description: typeLabel,
      estimated_band: r.estimated_band,
      created_at: r.created_at,
      href: `/speaking/${r.id}`,
    });
  }

  for (const r of vocab.data || []) {
    items.push({
      id: `vocab-${r.id}`,
      module: "vocab",
      title: "Vocab Card",
      description: `${r.word} — ${r.meaning}`,
      created_at: r.created_at,
      href: `/vocab`,
    });
  }

  for (const r of grammar.data || []) {
    items.push({
      id: `grammar-${r.id}`,
      module: "grammar",
      title: "Grammar Note",
      description: `${r.category}: ${r.rule}`,
      created_at: r.created_at,
      href: `/grammar`,
    });
  }

  // Sort by created_at desc, take top `limit`
  items.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return items.slice(0, limit);
}
