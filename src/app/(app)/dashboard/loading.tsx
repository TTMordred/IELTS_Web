export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-lg bg-[var(--color-line)]" />
          <div className="h-4 w-36 rounded bg-[var(--color-line)]" />
        </div>
        <div className="card-base w-24 h-20" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card-base p-4 h-16" />
        ))}
      </div>
      {/* Charts */}
      <div className="card-base p-5 h-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-base p-4 h-32" />
        ))}
      </div>
      <div className="card-base p-5 h-40" />
    </div>
  );
}
