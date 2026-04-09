"use client";

import { useState, useRef, useCallback } from "react";
import { importVocabBatch, importListeningBatch } from "@/app/(app)/settings/import/actions";
import type { ImportResult } from "@/app/(app)/settings/import/actions";

type ImportType = "vocab" | "listening";

const IMPORT_CONFIGS = {
  vocab: {
    label: "Vocab Cards",
    fields: [
      { key: "word", label: "Word", required: true },
      { key: "meaning", label: "Meaning", required: true },
      { key: "example", label: "Example", required: false },
      { key: "topic", label: "Topic", required: false },
    ],
  },
  listening: {
    label: "Listening Scores",
    fields: [
      { key: "date", label: "Date", required: true },
      { key: "test_name", label: "Test Name", required: true },
      { key: "source", label: "Source", required: true },
      { key: "total_score", label: "Total Score (0–40)", required: true },
    ],
  },
} as const;

// Pure JS CSV parser — handles quoted strings with commas and newlines
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Peek next char
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        field += ch;
        i++;
        continue;
      }
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }

    if (ch === "\r" || ch === "\n") {
      row.push(field);
      field = "";
      if (row.some((f) => f.trim())) {
        rows.push(row);
      }
      row = [];
      // Skip \r\n
      if (ch === "\r" && text[i + 1] === "\n") i++;
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  // Last field / row
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);

  return rows;
}

type Step = "upload" | "preview" | "import";

export function CsvImporter() {
  const [step, setStep] = useState<Step>("upload");
  const [importType, setImportType] = useState<ImportType>("vocab");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = IMPORT_CONFIGS[importType];

  function processFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a .csv file.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length < 2) {
        alert("CSV must have at least a header row and one data row.");
        return;
      }
      const [headerRow, ...dataRows] = parsed;
      setHeaders(headerRow);
      setRows(dataRows);

      // Auto-map columns by matching header name to field key (case-insensitive)
      const autoMap: Record<string, string> = {};
      for (const field of config.fields) {
        const match = headerRow.findIndex(
          (h) => h.trim().toLowerCase() === field.key.toLowerCase()
        );
        if (match !== -1) autoMap[field.key] = String(match);
      }
      setMapping(autoMap);
      setStep("preview");
    };
    reader.readAsText(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleTypeChange(type: ImportType) {
    setImportType(type);
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    setProgress(0);
  }

  async function handleImport() {
    const missingRequired = config.fields
      .filter((f) => f.required && !mapping[f.key])
      .map((f) => f.label);

    if (missingRequired.length > 0) {
      alert(`Please map required columns: ${missingRequired.join(", ")}`);
      return;
    }

    setImporting(true);
    setStep("import");
    setProgress(0);

    // Build typed rows from mapping
    const mappedRows = rows.map((row) => {
      const obj: Record<string, string> = {};
      for (const field of config.fields) {
        const colIdx = mapping[field.key];
        obj[field.key] = colIdx !== undefined ? (row[Number(colIdx)] ?? "") : "";
      }
      return obj;
    });

    // Simulate chunk progress
    const total = mappedRows.length;
    const CHUNK = 50;
    const importResult: ImportResult = { inserted: 0, errors: [] };

    for (let i = 0; i < total; i += CHUNK) {
      const chunk = mappedRows.slice(i, i + CHUNK);
      let chunkResult: ImportResult;

      if (importType === "vocab") {
        chunkResult = await importVocabBatch(
          chunk.map((r) => ({
            word: r.word,
            meaning: r.meaning,
            example: r.example || undefined,
            topic: r.topic || undefined,
          }))
        );
      } else {
        chunkResult = await importListeningBatch(
          chunk.map((r) => ({
            date: r.date,
            test_name: r.test_name,
            source: r.source,
            total_score: Number(r.total_score),
          }))
        );
      }

      importResult.inserted += chunkResult.inserted;
      importResult.errors.push(...chunkResult.errors);
      setProgress(Math.round(((i + chunk.length) / total) * 100));
    }

    setResult(importResult);
    setImporting(false);
  }

  function handleReset() {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const previewRows = rows.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Type Selector */}
      <div className="flex gap-2">
        {(["vocab", "listening"] as ImportType[]).map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
              importType === type
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-card)] border border-[var(--color-line)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            {IMPORT_CONFIGS[type].label}
          </button>
        ))}
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[var(--radius-lg)] p-12 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]"
              : "border-[var(--color-line)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-hover)]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="text-4xl mb-3">📂</div>
          <p className="heading-sm text-[var(--color-ink)]">
            Drop a CSV file here or click to browse
          </p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Expected columns for {config.label}:{" "}
            {config.fields.map((f) => f.key).join(", ")}
          </p>
        </div>
      )}

      {/* Step: Preview + Column Mapping */}
      {step === "preview" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="heading-sm">{fileName}</p>
              <p className="text-sm text-[var(--color-ink-secondary)]">
                {rows.length} data rows detected
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] underline"
            >
              Change file
            </button>
          </div>

          {/* Column Mapping */}
          <div className="bg-[var(--color-card)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-4 space-y-3">
            <p className="heading-sm">Map Columns</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-ink-secondary)]">
                    {field.label}
                    {field.required && (
                      <span className="text-[var(--color-critical)] ml-1">*</span>
                    )}
                  </label>
                  <select
                    value={mapping[field.key] ?? ""}
                    onChange={(e) =>
                      setMapping((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="text-sm rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-body)] px-3 py-1.5 text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  >
                    <option value="">— not mapped —</option>
                    {headers.map((h, idx) => (
                      <option key={idx} value={String(idx)}>
                        {h} (col {idx + 1})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-[var(--color-card)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden">
            <p className="px-4 py-2 text-xs font-medium text-[var(--color-ink-secondary)] border-b border-[var(--color-line)] bg-[var(--color-sidebar)]">
              Preview — first {Math.min(5, rows.length)} rows
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-line)]">
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        className="text-left px-4 py-2 text-xs font-semibold text-[var(--color-ink-secondary)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, ri) => (
                    <tr
                      key={ri}
                      className="border-b border-[var(--color-line-light)] last:border-0"
                    >
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-4 py-2 text-[var(--color-ink)] max-w-[200px] truncate"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              className="px-5 py-2 bg-[var(--color-accent)] text-white rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Import {rows.length} rows
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-2 border border-[var(--color-line)] rounded-[var(--radius-md)] text-sm text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step: Import Progress + Result */}
      {step === "import" && (
        <div className="space-y-5">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-[var(--color-ink-secondary)]">
              <span>{importing ? "Importing…" : "Done"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-[var(--color-line)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Result Summary */}
          {result && !importing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--color-card)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-4 text-center">
                  <p className="text-3xl font-bold text-[var(--color-low)]">
                    {result.inserted}
                  </p>
                  <p className="text-sm text-[var(--color-ink-secondary)] mt-1">
                    Rows imported
                  </p>
                </div>
                <div className="bg-[var(--color-card)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-4 text-center">
                  <p className="text-3xl font-bold text-[var(--color-critical)]">
                    {result.errors.length}
                  </p>
                  <p className="text-sm text-[var(--color-ink-secondary)] mt-1">
                    Errors
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-[var(--color-card)] border border-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden">
                  <p className="px-4 py-2 text-xs font-medium text-[var(--color-critical)] border-b border-[var(--color-line)] bg-[var(--color-sidebar)]">
                    Errors ({result.errors.length})
                  </p>
                  <ul className="divide-y divide-[var(--color-line-light)] max-h-48 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i} className="px-4 py-2 text-sm">
                        <span className="font-medium text-[var(--color-ink-secondary)]">
                          Row {err.row}:
                        </span>{" "}
                        <span className="text-[var(--color-critical)]">
                          {err.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleReset}
                className="px-5 py-2 bg-[var(--color-accent)] text-white rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Import another file
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
