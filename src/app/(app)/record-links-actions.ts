"use server";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type LinkableTable =
  | "listening_records"
  | "reading_records"
  | "writing_entries"
  | "speaking_entries"
  | "vocab_cards"
  | "mistake_entries";

export type RelationType =
  | "related"
  | "source"
  | "follow_up"
  | "mistake_of"
  | "vocab_from";

export type RecordLink = {
  id: string;
  target_table: LinkableTable;
  target_id: string;
  relation_type: RelationType | null;
  note: string | null;
  label: string;
  href: string;
};

function tableToHref(table: LinkableTable, id: string): string {
  switch (table) {
    case "listening_records":
      return `/listening/${id}`;
    case "reading_records":
      return `/reading/${id}`;
    case "writing_entries":
      return `/writing/${id}`;
    case "speaking_entries":
      return `/speaking/${id}`;
    case "vocab_cards":
      return `/vocab`;
    case "mistake_entries":
      return `/mistakes`;
  }
}

function tableToPaths(table: LinkableTable, id: string): string[] {
  switch (table) {
    case "listening_records":
      return ["/listening", `/listening/${id}`];
    case "reading_records":
      return ["/reading", `/reading/${id}`];
    case "writing_entries":
      return ["/writing", `/writing/${id}`];
    case "speaking_entries":
      return ["/speaking", `/speaking/${id}`];
    case "vocab_cards":
      return ["/vocab"];
    case "mistake_entries":
      return ["/mistakes"];
  }
}

async function fetchLabelsInBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: Array<{ table: LinkableTable; id: string }>
): Promise<Map<string, string>> {
  const labelMap = new Map<string, string>();

  // Group by table
  const groups = new Map<LinkableTable, string[]>();
  for (const { table, id } of items) {
    const ids = groups.get(table) ?? [];
    ids.push(id);
    groups.set(table, ids);
  }

  // Batch fetch per table in parallel
  const fetches = Array.from(groups.entries()).map(async ([table, ids]) => {
    try {
      switch (table) {
        case "listening_records": {
          const { data } = await supabase
            .from("listening_records")
            .select("id, test_name")
            .in("id", ids);
          for (const r of data ?? []) {
            labelMap.set(`${table}:${r.id}`, r.test_name ?? "Listening record");
          }
          break;
        }
        case "reading_records": {
          const { data } = await supabase
            .from("reading_records")
            .select("id, test_name")
            .in("id", ids);
          for (const r of data ?? []) {
            labelMap.set(`${table}:${r.id}`, r.test_name ?? "Reading record");
          }
          break;
        }
        case "writing_entries": {
          const { data } = await supabase
            .from("writing_entries")
            .select("id, topic")
            .in("id", ids);
          for (const r of data ?? []) {
            labelMap.set(`${table}:${r.id}`, r.topic ?? "Writing entry");
          }
          break;
        }
        case "speaking_entries": {
          const { data } = await supabase
            .from("speaking_entries")
            .select("id, type, date")
            .in("id", ids);
          for (const r of data ?? []) {
            labelMap.set(`${table}:${r.id}`, `Speaking - ${r.date}`);
          }
          break;
        }
        case "vocab_cards": {
          const { data } = await supabase
            .from("vocab_cards")
            .select("id, word")
            .in("id", ids);
          for (const r of data ?? []) {
            labelMap.set(`${table}:${r.id}`, r.word ?? "Vocab card");
          }
          break;
        }
        case "mistake_entries": {
          const { data } = await supabase
            .from("mistake_entries")
            .select("id, description")
            .in("id", ids);
          for (const r of data ?? []) {
            const desc: string = r.description ?? "Mistake entry";
            labelMap.set(
              `${table}:${r.id}`,
              desc.length > 50 ? desc.slice(0, 50) + "…" : desc
            );
          }
          break;
        }
      }
    } catch {
      // fallback: IDs for this table get no entry, callers use default
    }
  });

  await Promise.all(fetches);
  return labelMap;
}

async function fetchLabel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: LinkableTable,
  id: string
): Promise<string> {
  try {
    switch (table) {
      case "listening_records": {
        const { data } = await supabase
          .from("listening_records")
          .select("test_name")
          .eq("id", id)
          .single();
        return data?.test_name ?? "Listening record";
      }
      case "reading_records": {
        const { data } = await supabase
          .from("reading_records")
          .select("test_name")
          .eq("id", id)
          .single();
        return data?.test_name ?? "Reading record";
      }
      case "writing_entries": {
        const { data } = await supabase
          .from("writing_entries")
          .select("topic")
          .eq("id", id)
          .single();
        return data?.topic ?? "Writing entry";
      }
      case "speaking_entries": {
        const { data } = await supabase
          .from("speaking_entries")
          .select("type, date")
          .eq("id", id)
          .single();
        if (!data) return "Speaking entry";
        return `Speaking - ${data.date}`;
      }
      case "vocab_cards": {
        const { data } = await supabase
          .from("vocab_cards")
          .select("word")
          .eq("id", id)
          .single();
        return data?.word ?? "Vocab card";
      }
      case "mistake_entries": {
        const { data } = await supabase
          .from("mistake_entries")
          .select("description")
          .eq("id", id)
          .single();
        const desc: string = data?.description ?? "Mistake entry";
        return desc.length > 50 ? desc.slice(0, 50) + "…" : desc;
      }
    }
  } catch {
    return table.replace(/_/g, " ");
  }
}

export const getRelatedRecords = cache(async function getRelatedRecords(
  sourceTable: LinkableTable,
  sourceId: string
): Promise<RecordLink[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let links: Array<{
    id: string;
    source_table: string;
    source_id: string;
    target_table: string;
    target_id: string;
    relation_type: string | null;
    note: string | null;
  }> = [];

  try {
    const { data, error } = await supabase
      .from("record_links")
      .select("id, source_table, source_id, target_table, target_id, relation_type, note")
      .eq("user_id", user.id)
      .or(
        `and(source_table.eq.${sourceTable},source_id.eq.${sourceId}),and(target_table.eq.${sourceTable},target_id.eq.${sourceId})`
      );

    if (error) {
      // Table may not exist yet
      return [];
    }
    links = data ?? [];
  } catch {
    return [];
  }

  // Collect items with resolved direction
  const items = links.map((link) => {
    const isForward =
      link.source_table === sourceTable && link.source_id === sourceId;
    const table = (
      isForward ? link.target_table : link.source_table
    ) as LinkableTable;
    const id = isForward ? link.target_id : link.source_id;
    return { table, id, link };
  });

  // Batch fetch all labels in parallel (one query per table type)
  const labelMap = await fetchLabelsInBatch(
    supabase,
    items.map((i) => ({ table: i.table, id: i.id }))
  );

  // Map results
  const results: RecordLink[] = items.map(({ table, id, link }) => ({
    id: link.id,
    target_table: table,
    target_id: id,
    relation_type: (link.relation_type as RelationType) ?? null,
    note: link.note,
    label: labelMap.get(`${table}:${id}`) ?? table.replace(/_/g, " "),
    href: tableToHref(table, id),
  }));

  return results;
});

export async function createRecordLink(input: {
  source_table: LinkableTable;
  source_id: string;
  target_table: LinkableTable;
  target_id: string;
  relation_type?: RelationType;
  note?: string;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("record_links").insert({
    user_id: user.id,
    source_table: input.source_table,
    source_id: input.source_id,
    target_table: input.target_table,
    target_id: input.target_id,
    relation_type: input.relation_type ?? "related",
    note: input.note ?? null,
  });

  if (error) throw error;

  for (const path of tableToPaths(input.source_table, input.source_id)) {
    revalidatePath(path);
  }
}

export async function deleteRecordLink(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("record_links")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/listening");
  revalidatePath("/reading");
  revalidatePath("/writing");
  revalidatePath("/speaking");
}

export async function searchRecords(
  table: LinkableTable,
  query: string
): Promise<Array<{ id: string; label: string; subtitle?: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    switch (table) {
      case "listening_records": {
        const { data } = await supabase
          .from("listening_records")
          .select("id, test_name, date")
          .eq("user_id", user.id)
          .ilike("test_name", `%${query}%`)
          .limit(10);
        return (data ?? []).map((r) => ({
          id: r.id,
          label: r.test_name ?? "Untitled",
          subtitle: r.date,
        }));
      }
      case "reading_records": {
        const { data } = await supabase
          .from("reading_records")
          .select("id, test_name, date")
          .eq("user_id", user.id)
          .ilike("test_name", `%${query}%`)
          .limit(10);
        return (data ?? []).map((r) => ({
          id: r.id,
          label: r.test_name ?? "Untitled",
          subtitle: r.date,
        }));
      }
      case "writing_entries": {
        const { data } = await supabase
          .from("writing_entries")
          .select("id, topic, date")
          .eq("user_id", user.id)
          .ilike("topic", `%${query}%`)
          .limit(10);
        return (data ?? []).map((r) => ({
          id: r.id,
          label: r.topic ?? "Untitled",
          subtitle: r.date,
        }));
      }
      case "speaking_entries": {
        const { data } = await supabase
          .from("speaking_entries")
          .select("id, type, date")
          .eq("user_id", user.id)
          .ilike("type", `%${query}%`)
          .limit(10);
        return (data ?? []).map((r) => ({
          id: r.id,
          label: `Speaking - ${r.date}`,
          subtitle: r.type,
        }));
      }
      case "vocab_cards": {
        const { data } = await supabase
          .from("vocab_cards")
          .select("id, word, created_at")
          .eq("user_id", user.id)
          .ilike("word", `%${query}%`)
          .limit(10);
        return (data ?? []).map((r) => ({
          id: r.id,
          label: r.word ?? "Untitled",
          subtitle: r.created_at ? r.created_at.slice(0, 10) : undefined,
        }));
      }
      case "mistake_entries": {
        const { data } = await supabase
          .from("mistake_entries")
          .select("id, description, created_at")
          .eq("user_id", user.id)
          .ilike("description", `%${query}%`)
          .limit(10);
        return (data ?? []).map((r) => {
          const desc: string = r.description ?? "Untitled";
          return {
            id: r.id,
            label: desc.length > 50 ? desc.slice(0, 50) + "…" : desc,
            subtitle: r.created_at ? r.created_at.slice(0, 10) : undefined,
          };
        });
      }
    }
  } catch {
    return [];
  }
}
