import { checkIsAdmin } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { TopicBoard } from "@/components/topics/topic-board";
import { Library } from "lucide-react";

export default async function AdminTopicsPage() {
  await checkIsAdmin();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: topics } = await supabase
    .from("global_topics")
    .select("*, topic_upvotes(count)")
    .order("created_at", { ascending: false });

  // Check user upvotes
  const { data: userUpvotes } = await supabase
    .from("topic_upvotes")
    .select("topic_id")
    .eq("user_id", user!.id);

  const upvotedIds = new Set((userUpvotes || []).map((u) => u.topic_id));

  const enriched = (topics || []).map((t) => ({
    ...t,
    user_has_upvoted: upvotedIds.has(t.id),
  }));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <Library className="w-6 h-6 text-[var(--color-accent)]" />
          All Topics (Admin View)
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          {enriched.length} topics in the marketplace
        </p>
      </div>
      <TopicBoard initialTopics={enriched} />
    </div>
  );
}
