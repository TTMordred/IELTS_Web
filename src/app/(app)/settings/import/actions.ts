"use server";

import { createClient } from "@/lib/supabase/server";
import { scoreToBand } from "@/lib/constants/band-tables";

export type VocabImportRow = {
  word: string;
  meaning: string;
  example?: string;
  topic?: string;
};

export type ListeningImportRow = {
  date: string;
  test_name: string;
  source: string;
  total_score: number;
};

export type ImportResult = {
  inserted: number;
  errors: { row: number; message: string }[];
};

export async function importVocabBatch(
  rows: VocabImportRow[]
): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const result: ImportResult = { inserted: 0, errors: [] };

  const records = rows.map((row, i) => {
    if (!row.word?.trim()) {
      result.errors.push({ row: i + 1, message: "Missing required field: word" });
      return null;
    }
    if (!row.meaning?.trim()) {
      result.errors.push({ row: i + 1, message: "Missing required field: meaning" });
      return null;
    }
    return {
      user_id: user.id,
      word: row.word.trim(),
      meaning: row.meaning.trim(),
      example: row.example?.trim() || null,
      topic: row.topic?.trim() || null,
    };
  });

  const valid = records.filter(Boolean) as NonNullable<(typeof records)[0]>[];

  if (valid.length === 0) return result;

  // Batch in chunks of 50
  for (let i = 0; i < valid.length; i += 50) {
    const chunk = valid.slice(i, i + 50);
    const { error, data: inserted } = await supabase
      .from("vocab_cards")
      .insert(chunk)
      .select("id");

    if (error) {
      // Record error for entire chunk
      for (let j = i; j < i + chunk.length; j++) {
        result.errors.push({ row: j + 1, message: error.message });
      }
    } else {
      result.inserted += inserted?.length ?? chunk.length;
    }
  }

  return result;
}

export async function importListeningBatch(
  rows: ListeningImportRow[]
): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const result: ImportResult = { inserted: 0, errors: [] };

  const records = rows.map((row, i) => {
    if (!row.date?.trim()) {
      result.errors.push({ row: i + 1, message: "Missing required field: date" });
      return null;
    }
    if (!row.test_name?.trim()) {
      result.errors.push({ row: i + 1, message: "Missing required field: test_name" });
      return null;
    }
    if (!row.source?.trim()) {
      result.errors.push({ row: i + 1, message: "Missing required field: source" });
      return null;
    }
    const score = Number(row.total_score);
    if (isNaN(score) || score < 0 || score > 40) {
      result.errors.push({
        row: i + 1,
        message: `Invalid total_score: must be 0–40, got "${row.total_score}"`,
      });
      return null;
    }
    return {
      user_id: user.id,
      date: row.date.trim(),
      test_name: row.test_name.trim(),
      source: row.source.trim(),
      total_score: score,
      estimated_band: scoreToBand(score, "listening"),
    };
  });

  const valid = records.filter(Boolean) as NonNullable<(typeof records)[0]>[];

  if (valid.length === 0) return result;

  for (let i = 0; i < valid.length; i += 50) {
    const chunk = valid.slice(i, i + 50);
    const { error, data: inserted } = await supabase
      .from("listening_records")
      .insert(chunk)
      .select("id");

    if (error) {
      for (let j = i; j < i + chunk.length; j++) {
        result.errors.push({ row: j + 1, message: error.message });
      }
    } else {
      result.inserted += inserted?.length ?? chunk.length;
    }
  }

  return result;
}
