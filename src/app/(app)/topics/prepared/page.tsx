import Link from "next/link";
import { getPreparedTopics } from "../actions";
import { PreparedTopicCards } from "@/components/topics/prepared-topic-cards";
import { BookMarked, ChevronLeft } from "lucide-react";

export default async function PreparedTopicsPage() {
  const topics = await getPreparedTopics();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Link
        href="/topics"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> Topic Bank
      </Link>

      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-[var(--color-accent)]" />
          Prepared Topics
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Topics you have prepared in Speaking, with the records logged for each.
          {topics.length > 0 ? ` ${topics.length} ${topics.length === 1 ? "topic" : "topics"}.` : ""}
        </p>
      </div>

      {topics.length === 0 ? (
        <div className="card-base p-12 text-center">
          <h2 className="heading-md mb-2">No prepared topics yet</h2>
          <p className="text-[var(--color-ink-muted)]">
            Log a Speaking session answering a Topic Bank topic to see it here.
          </p>
          <Link
            href="/speaking/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            New Record
          </Link>
        </div>
      ) : (
        <PreparedTopicCards topics={topics} />
      )}
    </div>
  );
}
