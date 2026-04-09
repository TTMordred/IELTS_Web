import { getShareLinks } from "@/app/(app)/settings/share-actions";
import { ShareLinksClient } from "@/components/settings/share-links-client";
import { Link2 } from "lucide-react";

export default async function SharePage() {
  const links = await getShareLinks();

  return (
    <div className="space-y-6 animate-fade-in-up max-w-3xl">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <Link2 className="w-6 h-6 text-[var(--color-accent)]" />
          Share with Tutor
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Generate a read-only link to share your progress with a tutor or study partner.
        </p>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-line)] rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-card)]">
        <ShareLinksClient initialLinks={links} />
      </div>
    </div>
  );
}
