"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Spaced repetition intervals (in days)
const SR_INTERVALS = [1, 3, 7, 14, 30, 60];

export async function reviewVocabCard(cardId: string, remembered: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: card } = await supabase
    .from("vocab_cards")
    .select("review_count, mastery")
    .eq("id", cardId)
    .single();

  if (!card) throw new Error("Card not found");

  let newMastery: number;
  let newReviewCount: number;
  let nextInterval: number;

  if (remembered) {
    newReviewCount = card.review_count + 1;
    newMastery = Math.min(100, card.mastery + 15);
    const intervalIndex = Math.min(newReviewCount - 1, SR_INTERVALS.length - 1);
    nextInterval = SR_INTERVALS[intervalIndex];
  } else {
    // Reset — go back to beginning
    newReviewCount = 0;
    newMastery = Math.max(0, card.mastery - 20);
    nextInterval = 1;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + nextInterval);

  await supabase
    .from("vocab_cards")
    .update({
      review_count: newReviewCount,
      mastery: newMastery,
      next_review: nextReview.toISOString().split("T")[0],
    })
    .eq("id", cardId);

  // XP for review
  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabase
    .from("daily_activity")
    .select("id, xp_earned, vocab_reviewed")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase.from("daily_activity").update({
      xp_earned: existing.xp_earned + 3,
      vocab_reviewed: existing.vocab_reviewed + 1,
    }).eq("id", existing.id);
  } else {
    await supabase.from("daily_activity").insert({
      user_id: user.id, date: today, xp_earned: 3, vocab_reviewed: 1,
    });
  }

  // Update profile XP
  const { data: profile } = await supabase.from("profiles").select("total_xp").eq("id", user.id).single();
  await supabase.from("profiles").update({ total_xp: (profile?.total_xp || 0) + 3 }).eq("id", user.id);

  revalidatePath("/vocab");
  revalidatePath("/vocab/review");
}
