export default function ListeningLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-[var(--color-line)]" />
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card-base p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--color-line)] shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-[var(--color-line)]" />
              <div className="h-3 w-1/4 rounded bg-[var(--color-line)]" />
            </div>
            <div className="w-16 h-6 rounded-full bg-[var(--color-line)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
