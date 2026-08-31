import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PreparedTopic } from "@/app/(app)/topics/actions";

const PART_LABELS: Record<number, string> = {
  1: "Part 1",
  2: "Part 2",
  3: "Part 3",
};

/**
 * Card grid of prepared topics — shared by the compact preview on /topics and
 * the full list on /topics/prepared. Each card links to the topic's records.
 */
export function PreparedTopicCards({ topics }: { topics: PreparedTopic[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => (
        <Link
          key={topic.id}
          href={`/topics/${topic.id}`}
          className="card-interactive group flex items-center gap-3 p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[var(--color-ink)] truncate">{topic.name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              {topic.part ? (
                <span className="rounded-full bg-[var(--color-accent-light)] px-2 py-0.5 text-[var(--color-accent)]">
                  {PART_LABELS[topic.part]}
                </span>
              ) : null}
              {topic.category ? (
                <span className="truncate text-[var(--color-ink-muted)]">{topic.category}</span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-[var(--color-ink-muted)]">
            <span className="text-xs">
              {topic.record_count} {topic.record_count === 1 ? "record" : "records"}
            </span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </div>
  );
}
