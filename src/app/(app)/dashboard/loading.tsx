function Bone({ className }: { className: string }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header + Level badge */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Bone className="h-8 w-64" />
          <Bone className="h-4 w-40" />
        </div>
        <div className="card-base px-4 py-3 flex flex-col items-center gap-1.5 shrink-0">
          <Bone className="h-3 w-16 rounded-full" />
          <Bone className="h-5 w-10" />
          <Bone className="h-1.5 w-20 rounded-full" />
          <Bone className="h-3 w-12 rounded-full" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="card-base p-4 space-y-2">
            <Bone className="h-3 w-20 rounded-full" />
            <Bone className="h-6 w-12" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="card-base p-5 space-y-3">
        <Bone className="h-5 w-32" />
        <Bone className="h-36 w-full rounded-lg" />
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card-base p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Bone className="h-4 w-20" />
              <Bone className="h-5 w-8" />
            </div>
            <div className="flex gap-2">
              <Bone className="h-7 flex-1 rounded-md" />
              <Bone className="h-7 flex-1 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Activity calendar */}
      <div className="card-base p-5 space-y-3">
        <Bone className="h-5 w-36" />
        <Bone className="h-28 w-full rounded-lg" />
      </div>
    </div>
  );
}
