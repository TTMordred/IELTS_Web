function Bone({ className }: { className: string }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} />;
}

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Bone className="h-8 w-40" />
        <Bone className="h-4 w-56" />
      </div>

      {/* Filter bar */}
      <Bone className="h-10 w-full rounded-lg" />

      {/* Skill band overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card-base p-4 flex flex-col items-center gap-2">
            <Bone className="h-3 w-16 rounded-full" />
            <Bone className="h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Band trend chart */}
      <div className="card-base p-5 space-y-3">
        <Bone className="h-5 w-28" />
        <Bone className="h-52 w-full rounded-lg" />
      </div>

      {/* Skill radar */}
      <div className="card-base p-5 space-y-3">
        <Bone className="h-5 w-32" />
        <Bone className="h-44 w-44 rounded-full mx-auto" />
      </div>

      {/* Confidence trends */}
      <div className="card-base p-5 space-y-3">
        <Bone className="h-5 w-40" />
        <Bone className="h-36 w-full rounded-lg" />
      </div>
    </div>
  );
}
