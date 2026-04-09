import { getShareLinks, getAchievementCardData } from "@/app/(app)/settings/share-actions";
import { ShareLinksClient } from "@/components/settings/share-links-client";
import { AchievementCardCanvas } from "@/components/settings/achievement-card-canvas";
import { Link2, ImageIcon } from "lucide-react";

export default async function SharePage() {
  const [links, cardData] = await Promise.all([
    getShareLinks(),
    getAchievementCardData(),
  ]);

  return (
    <div className="space-y-8 animate-fade-in-up max-w-3xl">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <Link2 className="w-6 h-6 text-[var(--color-accent)]" />
          Share
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Generate a read-only link or download an achievement card to share your progress.
        </p>
      </div>

      {cardData && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 className="heading-md">Achievement Card</h2>
          </div>
          <div className="bg-[var(--color-card)] border border-[var(--color-line)] rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-card)]">
            <AchievementCardCanvas data={cardData} />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-[var(--color-accent)]" />
          <h2 className="heading-md">Tutor Share Links</h2>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-line)] rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-card)]">
          <ShareLinksClient initialLinks={links} />
        </div>
      </div>
    </div>
  );
}
