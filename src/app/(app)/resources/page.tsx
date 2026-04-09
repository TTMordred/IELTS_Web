import { getResources } from "./actions";
import { ResourceBoard } from "@/components/resources/resource-board";
import { Library } from "lucide-react";

export default async function ResourcesPage() {
  const resources = await getResources();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <Library className="w-6 h-6 text-[var(--color-accent)]" />
          Resource Library
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Save and organize your IELTS study materials. {resources.length} resources.
        </p>
      </div>
      <ResourceBoard initialResources={resources} />
    </div>
  );
}
