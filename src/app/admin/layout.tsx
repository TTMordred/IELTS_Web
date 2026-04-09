import { checkIsAdmin } from "./actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkIsAdmin();

  return (
    <div className="min-h-screen bg-[var(--color-body)]">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-card)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="heading-sm">Admin Dashboard</span>
          </div>
          <a href="/dashboard" className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors cursor-pointer">
            Back to App
          </a>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
