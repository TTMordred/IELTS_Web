export default function ActivityLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-[var(--color-line)]" />
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card-base p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-line)] shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded bg-[var(--color-line)]" />
              <div className="h-3 w-1/3 rounded bg-[var(--color-line)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
