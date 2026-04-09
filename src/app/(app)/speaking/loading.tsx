function Bone({ className }: { className: string }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} />;
}

export default function SpeakingLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-8 w-48" />
          <Bone className="h-4 w-28" />
        </div>
        <Bone className="h-9 w-32 rounded-lg" />
      </div>

      {/* Entry rows */}
      <div className="space-y-3">
        {[0, 60, 120, 180, 240, 300, 360].map((delay) => (
          <div
            key={delay}
            className="card-base p-4 flex items-center gap-4"
          >
            <Bone className="w-12 h-12 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Bone className="h-4 w-1/3" />
              <Bone className="h-3 w-1/5" />
            </div>
            {/* Criteria mini scores */}
            <div className="hidden sm:flex items-center gap-4 shrink-0">
              {["FC", "LR", "GR", "PR"].map((label) => (
                <div key={label} className="text-center space-y-1">
                  <Bone className="h-2.5 w-6 mx-auto rounded-full" />
                  <Bone className="h-4 w-6 mx-auto" />
                </div>
              ))}
            </div>
            <Bone className="h-5 w-20 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
