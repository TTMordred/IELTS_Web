export default function PhraseBankLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded bg-[var(--color-line)]" />
        <div className="h-4 w-80 max-w-full rounded bg-[var(--color-line-light)]" />
      </div>
      <div className="h-10 rounded-lg bg-[var(--color-line-light)]" />
      <div className="grid gap-3 md:grid-cols-2">
        {[1, 2, 3, 4].map((item) => <div key={item} className="h-32 rounded-xl bg-[var(--color-line-light)]" />)}
      </div>
    </div>
  );
}
