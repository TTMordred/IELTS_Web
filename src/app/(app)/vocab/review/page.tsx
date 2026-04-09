import { createClient } from "@/lib/supabase/server";
import { ReviewSession } from "@/components/vocab/review-session";
import Link from "next/link";

export default async function VocabReviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().split("T")[0];

  const { data: dueCards } = await supabase
    .from("vocab_cards")
    .select("*")
    .eq("user_id", user.id)
    .lte("next_review", today)
    .order("next_review", { ascending: true })
    .limit(30);

  return (
    <div className="space-y-4">
      {/* Or try: */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
        <span>Or try:</span>
        <Link
          href="/vocab/flashcard"
          className="text-[var(--color-accent)] hover:underline font-medium"
        >
          Flashcards
        </Link>
        <span>·</span>
        <Link
          href="/vocab/quiz"
          className="text-[#378ADD] hover:underline font-medium"
        >
          Quiz
        </Link>
      </div>

      <ReviewSession cards={dueCards || []} />
    </div>
  );
}
