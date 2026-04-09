import { Activity } from "lucide-react";
import { getActivityFeed } from "./actions";
import { ActivityFeed } from "@/components/activity/activity-feed";

export default async function ActivityPage() {
  const items = await getActivityFeed(60);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <Activity className="w-6 h-6 text-[var(--color-accent)]" />
          Activity Feed
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          All your study activity across every module
        </p>
      </div>

      <ActivityFeed items={items} />
    </div>
  );
}
