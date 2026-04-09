function Bone({ className }: { className: string }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} />;
}

export default function GrammarLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Bone className="h-8 w-40" />
        <Bone className="h-4 w-60" />
      </div>

      {/* Grammar entries */}
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card-base p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Bone className={`h-4 ${i % 3 === 0 ? "w-1/3" : i % 3 === 1 ? "w-2/5" : "w-1/4"}`} />
              <Bone className="h-5 w-14 rounded-full" />
            </div>
            <Bone className="h-3 w-full" />
            <Bone className={`h-3 ${i % 2 === 0 ? "w-4/5" : "w-3/5"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
