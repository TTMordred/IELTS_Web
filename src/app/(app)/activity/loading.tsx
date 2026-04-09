function Bone({ className }: { className: string }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} />;
}

export default function ActivityLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Bone className="h-8 w-44" />
        <Bone className="h-4 w-64" />
      </div>

      {/* Feed items */}
      <div className="space-y-3">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="card-base p-4 flex items-center gap-3">
            {/* Icon circle */}
            <Bone className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Bone className={`h-4 ${i % 3 === 0 ? "w-2/3" : i % 3 === 1 ? "w-1/2" : "w-3/4"}`} />
              <Bone className="h-3 w-24" />
            </div>
            <Bone className="h-5 w-14 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
