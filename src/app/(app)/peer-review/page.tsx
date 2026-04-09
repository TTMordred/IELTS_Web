import { MessageSquareCode } from "lucide-react";

export default function PeerReviewPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <MessageSquareCode className="w-6 h-6 text-[var(--color-accent)]" />
          Peer Review Exchange
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Get feedback on your writing and speaking from fellow learners.
        </p>
      </div>

      <div className="card-base p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-light)] flex items-center justify-center mx-auto">
          <MessageSquareCode className="w-8 h-8 text-[var(--color-accent)]" />
        </div>
        <h2 className="heading-md">Coming Soon</h2>
        <p className="text-[var(--color-ink-secondary)] max-w-md mx-auto text-sm">
          Peer Review Exchange will let you submit writing essays and speaking responses for
          structured feedback from other IELTS learners. Give feedback, earn credits, get
          better — together.
        </p>
        <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-semibold tracking-wide">
          Planned for Phase E
        </div>
      </div>
    </div>
  );
}
