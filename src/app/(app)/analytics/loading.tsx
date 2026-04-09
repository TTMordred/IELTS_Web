export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-[var(--color-line)]" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-base p-4 h-20" />
        ))}
      </div>
      <div className="card-base p-5 h-64" />
      <div className="card-base p-5 h-48" />
      <div className="card-base p-5 h-48" />
    </div>
  );
}
