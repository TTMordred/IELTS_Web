import Link from "next/link";
import { FileDown, Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <Settings className="w-6 h-6 text-[var(--color-accent)]" />
          Settings
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Manage your account and export your data.
        </p>
      </div>

      <div className="card-base p-5 flex items-center gap-4 hover:bg-[var(--color-surface)] transition-colors">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-light)] flex items-center justify-center shrink-0">
          <FileDown className="w-5 h-5 text-[var(--color-accent)]" />
        </div>
        <div className="flex-1">
          <h2 className="heading-md">Export Progress Report</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">
            Generate a printable PDF summary of your IELTS progress
          </p>
        </div>
        <Link
          href="/settings/export"
          className="text-sm text-[var(--color-accent)] font-medium hover:underline shrink-0 cursor-pointer"
        >
          Open &rarr;
        </Link>
      </div>
    </div>
  );
}
