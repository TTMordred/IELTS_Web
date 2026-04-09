function Bone({ className }: { className: string }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} />;
}

export default function WritingLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-8 w-44" />
          <Bone className="h-4 w-24" />
        </div>
        <Bone className="h-9 w-28 rounded-lg" />
      </div>

      {/* Entry rows */}
      <div className="space-y-3">
        {[0, 60, 120, 180, 240, 300, 360].map((delay) => (
          <div
            key={delay}
            className="card-base p-4 flex items-center gap-4"
            style={{ animationDelay: `${delay}ms` }}
          >
            <Bone className="w-12 h-12 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-2/5" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Bone className="h-5 w-8 rounded-full" />
              <Bone className="h-4 w-16 hidden sm:block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
