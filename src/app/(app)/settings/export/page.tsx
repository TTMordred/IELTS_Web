"use client";

import { useState, useTransition } from "react";
import { getExportData, ExportData } from "../export-actions";
import { FileDown, Printer, Loader2 } from "lucide-react";
import Link from "next/link";

const SECTIONS = [
  { id: "profile", label: "Profile & Stats" },
  { id: "listening", label: "Listening" },
  { id: "reading", label: "Reading" },
  { id: "writing", label: "Writing" },
  { id: "speaking", label: "Speaking" },
  { id: "vocab", label: "Vocabulary" },
  { id: "analytics", label: "Analytics & Heatmaps" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function bandColor(band: number | null): string {
  if (band == null) return "#888";
  if (band >= 7.0) return "#16a34a";
  if (band >= 5.5) return "#ca8a04";
  return "#dc2626";
}

function fmt(band: number | null): string {
  if (band == null) return "—";
  return band.toFixed(1);
}

function PrintReport({
  data,
  sections,
}: {
  data: ExportData;
  sections: Set<SectionId>;
}) {
  const overallBands = [
    data.listening.latest_band,
    data.reading.latest_band,
    data.writing.latest_band,
    data.speaking.latest_band,
  ].filter((b): b is number => b != null);
  const overallBand =
    overallBands.length > 0
      ? overallBands.reduce((a, b) => a + b, 0) / overallBands.length
      : null;

  const generatedDate = new Date(data.generated_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const modules = [
    { id: "listening" as SectionId, label: "Listening", summary: data.listening, color: "#378ADD" },
    { id: "reading" as SectionId, label: "Reading", summary: data.reading, color: "#D85A30" },
    { id: "writing" as SectionId, label: "Writing", summary: data.writing, color: "#993556" },
    { id: "speaking" as SectionId, label: "Speaking", summary: data.speaking, color: "#1D9E75" },
  ];

  return (
    <div id="print-report">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-report, #print-report * { visibility: visible !important; }
          #print-report {
            position: fixed !important;
            top: 0; left: 0;
            width: 100vw;
            background: #fff !important;
            color: #111 !important;
            padding: 32px !important;
            font-family: Georgia, serif !important;
          }
          .no-print { display: none !important; }
        }
        #print-report {
          background: #fff;
          color: #111;
          font-family: Georgia, serif;
          font-size: 14px;
          line-height: 1.6;
          padding: 0;
        }
        #print-report h1 { font-size: 22px; margin: 0 0 4px; font-weight: bold; }
        #print-report h2 { font-size: 16px; margin: 16px 0 8px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
        #print-report h3 { font-size: 13px; font-weight: bold; margin: 0 0 6px; }
        #print-report .meta { color: #555; font-size: 12px; margin-bottom: 16px; }
        #print-report .band-large { font-size: 32px; font-weight: bold; font-family: monospace; }
        #print-report .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        #print-report .grid4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
        #print-report .card { border: 1px solid #ddd; border-radius: 6px; padding: 10px 14px; }
        #print-report .label { font-size: 11px; color: #777; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
        #print-report table { width: 100%; border-collapse: collapse; font-size: 12px; }
        #print-report th { background: #f5f5f5; text-align: left; padding: 6px 8px; font-weight: bold; border: 1px solid #ddd; }
        #print-report td { padding: 5px 8px; border: 1px solid #eee; }
        #print-report tr:nth-child(even) td { background: #fafafa; }
        #print-report .heatmap-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        #print-report .heatmap-chip { width: 40px; height: 22px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; font-family: monospace; color: #fff; flex-shrink: 0; }
        #print-report .page-break { page-break-before: always; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "2px solid #111", paddingBottom: 12, marginBottom: 16 }}>
        <h1>IELTS Progress Report</h1>
        <div className="meta">
          Generated: {generatedDate}
          {data.profile.exam_date && ` · Exam Date: ${data.profile.exam_date}`}
        </div>
      </div>

      {/* Profile Section */}
      {sections.has("profile") && (
        <section>
          <h2>Profile &amp; Stats</h2>
          <div className="grid4" style={{ marginBottom: 12 }}>
            <div className="card">
              <div className="label">Student</div>
              <div style={{ fontWeight: "bold" }}>{data.profile.display_name}</div>
            </div>
            <div className="card">
              <div className="label">Target Band</div>
              <div style={{ fontWeight: "bold", fontFamily: "monospace", fontSize: 18 }}>
                {data.profile.target_band ?? "—"}
              </div>
            </div>
            <div className="card">
              <div className="label">Current Streak</div>
              <div style={{ fontWeight: "bold", fontFamily: "monospace", fontSize: 18 }}>
                {data.profile.current_streak}d
              </div>
            </div>
            <div className="card">
              <div className="label">Total XP</div>
              <div style={{ fontWeight: "bold", fontFamily: "monospace", fontSize: 18 }}>
                {data.profile.total_xp.toLocaleString()}
              </div>
            </div>
          </div>
          {overallBand != null && (
            <div className="card" style={{ display: "inline-block", marginBottom: 8 }}>
              <div className="label">Overall Band Estimate</div>
              <div className="band-large" style={{ color: bandColor(overallBand) }}>
                {fmt(Math.round(overallBand * 2) / 2)}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Module Sections */}
      {modules
        .filter(({ id }) => sections.has(id))
        .map(({ label, summary, color }) => (
          <section key={label}>
            <h2 style={{ borderBottomColor: color }}>{label}</h2>
            <div className="grid2" style={{ marginBottom: 8 }}>
              <div className="card">
                <div className="label">Records</div>
                <div style={{ fontWeight: "bold", fontFamily: "monospace", fontSize: 20 }}>{summary.count}</div>
              </div>
              <div className="card">
                <div className="label">Latest Band</div>
                <div style={{ fontWeight: "bold", fontFamily: "monospace", fontSize: 20, color: bandColor(summary.latest_band) }}>
                  {fmt(summary.latest_band)}
                </div>
              </div>
            </div>
            {summary.avg_band != null && (
              <div className="card" style={{ display: "inline-block" }}>
                <div className="label">Average Band</div>
                <div style={{ fontWeight: "bold", fontFamily: "monospace", fontSize: 16, color: bandColor(summary.avg_band) }}>
                  {fmt(summary.avg_band)}
                </div>
              </div>
            )}
          </section>
        ))}

      {/* Vocab */}
      {sections.has("vocab") && (
        <section>
          <h2>Vocabulary</h2>
          <div className="card" style={{ display: "inline-block" }}>
            <div className="label">Total Cards</div>
            <div style={{ fontWeight: "bold", fontFamily: "monospace", fontSize: 20 }}>{data.vocab_count}</div>
          </div>
        </section>
      )}

      {/* Analytics & Heatmaps */}
      {sections.has("analytics") && (
        <section>
          <h2>Analytics &amp; Heatmaps</h2>

          {data.writing_heatmap.length > 0 && (
            <>
              <h3>Writing Sub-types</h3>
              <div style={{ marginBottom: 12 }}>
                {data.writing_heatmap.map((row) => {
                  const chipColor = row.count < 3 ? "#ccc" : row.avg >= 7 ? "#16a34a" : row.avg >= 5.5 ? "#ca8a04" : "#dc2626";
                  return (
                    <div key={row.key} className="heatmap-row">
                      <div className="heatmap-chip" style={{ backgroundColor: chipColor }}>
                        {row.count < 3 ? "—" : row.avg.toFixed(1)}
                      </div>
                      <span style={{ fontSize: 12 }}>{row.label}</span>
                      <span style={{ fontSize: 11, color: "#777", marginLeft: "auto" }}>{row.count} entries</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {data.speaking_heatmap.length > 0 && (
            <>
              <h3>Speaking Criteria &amp; Topics</h3>
              <div>
                {data.speaking_heatmap.map((row) => {
                  const chipColor = row.count < 3 ? "#ccc" : row.avg >= 7 ? "#16a34a" : row.avg >= 5.5 ? "#ca8a04" : "#dc2626";
                  return (
                    <div key={row.key} className="heatmap-row">
                      <div className="heatmap-chip" style={{ backgroundColor: chipColor }}>
                        {row.count < 3 ? "—" : row.avg.toFixed(1)}
                      </div>
                      <span style={{ fontSize: 12 }}>{row.label}</span>
                      <span style={{ fontSize: 11, color: "#777", marginLeft: "auto" }}>{row.count} entries</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Recent Activity */}
          {data.recent_activity.length > 0 && (
            <>
              <h3 style={{ marginTop: 16 }}>Recent Activity (last 10)</h3>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Module</th>
                    <th>Band</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_activity.map((row, i) => (
                    <tr key={i}>
                      <td>{row.date}</td>
                      <td>{row.module}</td>
                      <td style={{ fontFamily: "monospace", color: bandColor(row.band) }}>{fmt(row.band)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>
      )}

      <div style={{ marginTop: 24, fontSize: 11, color: "#999", borderTop: "1px solid #eee", paddingTop: 8 }}>
        IELTS Self-Study Hub · {generatedDate}
      </div>
    </div>
  );
}

export default function ExportPage() {
  const [selected, setSelected] = useState<Set<SectionId>>(
    new Set(SECTIONS.map((s) => s.id))
  );
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleSection(id: SectionId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const data = await getExportData();
        if (!data) {
          setError("Could not load your data. Please try again.");
          return;
        }
        setExportData(data);
      } catch {
        setError("Failed to load data. Please try again.");
      }
    });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6 animate-fade-in-up no-print">
      {/* Header */}
      <div>
        <h1 className="heading-lg flex items-center gap-2">
          <FileDown className="w-6 h-6 text-[var(--color-accent)]" />
          Export Progress Report
        </h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Select sections to include, generate the report, then print or save as PDF.
        </p>
      </div>

      {/* Section Selector */}
      <div className="card-base p-5">
        <h2 className="heading-sm mb-3">Select Sections</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SECTIONS.map((section) => (
            <label
              key={section.id}
              className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.has(section.id)}
                onChange={() => toggleSection(section.id)}
                className="w-4 h-4 accent-[var(--color-accent)]"
              />
              <span className="text-sm text-[var(--color-ink)]">{section.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={isPending || selected.size === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              Generate Report
            </>
          )}
        </button>

        {exportData && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Report Preview */}
      {exportData && (
        <div className="card-base p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-sm">Report Preview</h2>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
          <div className="border border-[var(--color-line)] rounded-lg p-6 bg-white text-black">
            <PrintReport data={exportData} sections={selected} />
          </div>
        </div>
      )}

      <div className="text-center">
        <Link
          href="/settings"
          className="text-sm text-[var(--color-accent)] hover:underline cursor-pointer"
        >
          Back to Settings
        </Link>
      </div>
    </div>
  );
}
