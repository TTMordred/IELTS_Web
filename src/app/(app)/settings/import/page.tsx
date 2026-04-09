import { CsvImporter } from "@/components/settings/csv-importer";
import { Upload } from "lucide-react";

export default function ImportPage() {
  return (
    <div className="space-y-6 animate-fade-in-up max-w-3xl">
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <Upload className="w-6 h-6 text-[var(--color-accent)]" />
          Batch Import
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Import vocab cards or listening scores from a CSV file.
        </p>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-line)] rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-card)]">
        <CsvImporter />
      </div>
    </div>
  );
}
