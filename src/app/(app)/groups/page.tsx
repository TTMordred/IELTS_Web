import { Users } from "lucide-react";

export default function StudyGroupsPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <Users className="w-6 h-6 text-[var(--color-accent)]" />
          Study Groups
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Study together, stay accountable, go further.
        </p>
      </div>

      <div className="card-base p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-light)] flex items-center justify-center mx-auto">
          <Users className="w-8 h-8 text-[var(--color-accent)]" />
        </div>
        <h2 className="heading-md">Coming Soon</h2>
        <p className="text-[var(--color-ink-secondary)] max-w-md mx-auto text-sm">
          Study Groups will let you join cohorts of learners with the same target band and exam date.
          Share progress, compete on leaderboards, and keep each other accountable.
        </p>
        <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-semibold tracking-wide">
          Planned for Phase E
        </div>
      </div>
    </div>
  );
}
