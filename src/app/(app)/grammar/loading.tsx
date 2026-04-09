export default function GrammarLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-[var(--color-line)]" />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card-base p-5 space-y-3">
            <div className="h-4 w-1/3 rounded bg-[var(--color-line)]" />
            <div className="h-3 w-full rounded bg-[var(--color-line)]" />
            <div className="h-3 w-4/5 rounded bg-[var(--color-line)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
