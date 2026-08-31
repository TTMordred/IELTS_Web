import Link from "next/link";
import { getTopics, getPreparedTopics } from "./actions";
import { TopicBoard } from "@/components/topics/topic-board";
import { PreparedTopicCards } from "@/components/topics/prepared-topic-cards";
import { ArrowRight, BookMarked, Library } from "lucide-react";

export default async function TopicsPage() {
  const [topics, preparedTopics] = await Promise.all([getTopics(), getPreparedTopics()]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <Library className="w-6 h-6 text-[var(--color-accent)]" />
          Topic Bank
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Browse, contribute, and upvote IELTS topics. {topics.length} topics available.
        </p>
      </div>

      {preparedTopics.length > 0 ? (
        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="heading-md flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-[var(--color-accent)]" />
                Prepared Topics
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                Topics you have prepared in Speaking, with the records you logged for each.
              </p>
            </div>
            <Link
              href="/topics/prepared"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              View all ({preparedTopics.length})
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4">
            <PreparedTopicCards topics={preparedTopics.slice(0, 3)} />
          </div>
        </section>
      ) : null}

      <TopicBoard initialTopics={topics} />
    </div>
  );
}
