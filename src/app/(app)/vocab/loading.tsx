export default function VocabLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-[var(--color-line)]" />
      <div className="card-base p-5 h-44" />
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="card-base p-4 flex items-center gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/4 rounded bg-[var(--color-line)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--color-line)]" />
            </div>
            <div className="w-16 h-6 rounded-full bg-[var(--color-line)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
