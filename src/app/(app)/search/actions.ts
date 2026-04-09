"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchResultItem = {
  id: string;
  type:
    | "vocab"
    | "grammar"
    | "listening"
    | "reading"
    | "writing"
    | "speaking"
    | "topic";
  title: string;
  subtitle?: string;
  href: string;
};

export type SearchResults = {
  vocab: SearchResultItem[];
  grammar: SearchResultItem[];
  listening: SearchResultItem[];
  reading: SearchResultItem[];
  writing: SearchResultItem[];
  speaking: SearchResultItem[];
  topics: SearchResultItem[];
};

export async function globalSearch(query: string): Promise<SearchResults> {
  const empty: SearchResults = {
    vocab: [],
    grammar: [],
    listening: [],
    reading: [],
    writing: [],
    speaking: [],
    topics: [],
  };

  if (!query || query.trim().length < 1) return empty;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const q = query.trim();

  const [
    vocabRes,
    grammarRes,
    listeningRes,
    readingRes,
    writingRes,
    speakingRes,
    topicsRes,
  ] = await Promise.all([
    supabase
      .from("vocab_cards")
      .select("id, word, meaning, topic")
      .eq("user_id", user.id)
      .or(`word.ilike.%${q}%,meaning.ilike.%${q}%`)
      .limit(5),

    supabase
      .from("grammar_notes")
      .select("id, rule, category")
      .eq("user_id", user.id)
      .or(`rule.ilike.%${q}%,category.ilike.%${q}%`)
      .limit(5),

    supabase
      .from("listening_records")
      .select("id, test_name, date, estimated_band")
      .eq("user_id", user.id)
      .ilike("test_name", `%${q}%`)
      .limit(5),

    supabase
      .from("reading_records")
      .select("id, test_name, date, estimated_band")
      .eq("user_id", user.id)
      .ilike("test_name", `%${q}%`)
      .limit(5),

    supabase
      .from("writing_entries")
      .select("id, topic, question_text, date")
      .eq("user_id", user.id)
      .or(`topic.ilike.%${q}%,question_text.ilike.%${q}%`)
      .limit(5),

    supabase
      .from("speaking_entries")
      .select("id, date, type")
      .eq("user_id", user.id)
      .or(`date.ilike.%${q}%,type.ilike.%${q}%`)
      .limit(5),

    supabase
      .from("global_topics")
      .select("id, name, module, part")
      .ilike("name", `%${q}%`)
      .limit(5),
  ]);

  return {
    vocab: (vocabRes.data || []).map((r) => ({
      id: r.id,
      type: "vocab" as const,
      title: r.word,
      subtitle: r.meaning,
      href: `/vocab`,
    })),

    grammar: (grammarRes.data || []).map((r) => ({
      id: r.id,
      type: "grammar" as const,
      title: r.rule,
      subtitle: r.category,
      href: `/grammar`,
    })),

    listening: (listeningRes.data || []).map((r) => ({
      id: r.id,
      type: "listening" as const,
      title: r.test_name,
      subtitle: r.estimated_band ? `Band ${r.estimated_band} · ${r.date}` : r.date,
      href: `/listening/${r.id}`,
    })),

    reading: (readingRes.data || []).map((r) => ({
      id: r.id,
      type: "reading" as const,
      title: r.test_name,
      subtitle: r.estimated_band ? `Band ${r.estimated_band} · ${r.date}` : r.date,
      href: `/reading/${r.id}`,
    })),

    writing: (writingRes.data || []).map((r) => ({
      id: r.id,
      type: "writing" as const,
      title: r.topic || r.question_text || "Writing Entry",
      subtitle: r.date,
      href: `/writing`,
    })),

    speaking: (speakingRes.data || []).map((r) => ({
      id: r.id,
      type: "speaking" as const,
      title: `${r.type || "Speaking"} · ${r.date}`,
      subtitle: r.date,
      href: `/speaking`,
    })),

    topics: (topicsRes.data || []).map((r) => ({
      id: r.id,
      type: "topic" as const,
      title: r.name,
      subtitle: [r.module, r.part].filter(Boolean).join(" · "),
      href: `/topics`,
    })),
  };
}
