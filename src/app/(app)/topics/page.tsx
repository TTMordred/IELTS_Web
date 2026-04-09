import { getTopics } from "./actions";
import { TopicBoard } from "@/components/topics/topic-board";
import { Library } from "lucide-react";

export default async function TopicsPage() {
  const topics = await getTopics();

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
      <TopicBoard initialTopics={topics} />
    </div>
  );
}
