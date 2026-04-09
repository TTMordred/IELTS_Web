function Bone({ className }: { className: string }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} />;
}

export default function VocabLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Bone className="h-8 w-36" />
        <Bone className="h-4 w-28" />
      </div>

      {/* Practice hub */}
      <div className="card-base p-5 space-y-4">
        <div className="space-y-1">
          <Bone className="h-5 w-20" />
          <Bone className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-[var(--color-line)] space-y-3">
              <Bone className="w-10 h-10 rounded-lg" />
              <Bone className="h-4 w-24" />
              <Bone className="h-3 w-36" />
            </div>
          ))}
        </div>
        <div className="flex gap-6 pt-4 border-t border-[var(--color-line)]">
          <Bone className="h-4 w-20" />
          <Bone className="h-4 w-20" />
          <Bone className="h-4 w-20" />
        </div>
      </div>

      {/* Vocab list */}
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card-base p-4 flex items-center gap-3">
            <div className="flex-1 space-y-1.5 min-w-0">
              <Bone className={`h-4 ${i % 2 === 0 ? "w-1/4" : "w-1/3"}`} />
              <Bone className="h-3 w-1/2" />
            </div>
            <Bone className="h-5 w-16 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
