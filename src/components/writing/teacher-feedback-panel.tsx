import React from "react";
import {
  Brain,
  LayoutTemplate,
  PenLine,
  BookOpen,
  Target,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Search,
  AlignLeft,
  ListOrdered,
  MessageCircle,
  ChevronDown,
  Check,
  AlertCircle,
  Link2,
  GraduationCap,
} from "lucide-react";
import type {
  TeacherFeedback,
  RichTeacherFeedback,
  CriterionFeedback,
  VocabUpgrade,
  GrammarItem,
  ParagraphAnalysis,
  ModelOutlineItem,
} from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────

type Props = { feedback: TeacherFeedback | RichTeacherFeedback };

// ── Legacy sections (v1) ───────────────────────────────────────────────────

const LEGACY_SECTIONS: {
  key: keyof TeacherFeedback;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
}[] = [
  { key: "logic", label: "Logic & Reasoning", Icon: Brain, color: "#6366f1" },
  { key: "structure", label: "Essay Structure", Icon: LayoutTemplate, color: "#0ea5e9" },
  { key: "grammar", label: "Grammar", Icon: PenLine, color: "#f59e0b" },
  { key: "vocab", label: "Vocabulary", Icon: BookOpen, color: "#10b981" },
  { key: "enhancement", label: "Improvements", Icon: Target, color: "#993556" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function bandColor(band: number): string {
  if (band >= 8) return "#22c55e";
  if (band >= 7) return "#84cc16";
  if (band >= 6) return "#eab308";
  if (band >= 5) return "#f97316";
  return "#ef4444";
}

const CRITERION_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  ta: Target,
  cc: Link2,
  lr: BookOpen,
  gra: PenLine,
};

function statusBadge(status: ParagraphAnalysis["status"]) {
  if (status === "good")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
        <Check size={11} /> Good
      </span>
    );
  if (status === "weak")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
        <AlertTriangle size={11} /> Weak
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
      <AlertCircle size={11} /> Missing
    </span>
  );
}

// ── Sub-components (Rich) ──────────────────────────────────────────────────

function MetricCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white border border-[var(--color-line)] rounded-xl px-4 py-3 flex-1 min-w-0">
      <span className="text-xl font-bold text-[var(--color-ink)]">{value}</span>
      <span className="text-xs text-[var(--color-ink-muted)] mt-0.5 text-center leading-tight">{label}</span>
    </div>
  );
}

function CriterionSection({ c }: { c: CriterionFeedback }) {
  const CriterionIcon = CRITERION_ICONS[c.id] ?? PenLine;
  const color = bandColor(c.band);

  return (
    <details open className="group border border-[var(--color-line)] rounded-xl overflow-hidden">
      <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer select-none list-none hover:bg-[var(--color-surface-hover)] transition-colors bg-white">
        <CriterionIcon size={16} className="shrink-0 text-[var(--color-ink-muted)]" />
        <span className="text-sm font-semibold text-[var(--color-ink)] flex-1">{c.name}</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full border"
          style={{ color, borderColor: color, backgroundColor: color + "18" }}
        >
          Band {c.band}
        </span>
        <span className="text-xs font-medium hidden sm:inline" style={{ color }}>
          {c.verdict}
        </span>
        <ChevronDown size={14} className="ml-1 text-[var(--color-ink-muted)] group-open:rotate-180 transition-transform" />
      </summary>

      <div className="px-5 pb-5 pt-3 bg-white space-y-4">
        {/* Verdict on mobile */}
        <p className="sm:hidden text-xs font-medium" style={{ color }}>
          {c.verdict}
        </p>

        {/* Strengths */}
        {c.strengths.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
              <CheckCircle2 size={12} /> Strengths
            </p>
            <ul className="space-y-1.5">
              {c.strengths.map((s, i) => (
                <li
                  key={i}
                  className="text-sm text-[var(--color-ink-secondary)] leading-relaxed pl-3 border-l-2 border-green-300"
                >
                  {s.text}
                  {s.evidence && (
                    <em className="block text-xs text-[var(--color-ink-muted)] mt-0.5 not-italic italic">
                      &ldquo;{s.evidence}&rdquo;
                    </em>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {c.weaknesses.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
              <AlertTriangle size={12} /> Weaknesses
            </p>
            <ul className="space-y-1.5">
              {c.weaknesses.map((w, i) => (
                <li
                  key={i}
                  className="text-sm text-[var(--color-ink-secondary)] leading-relaxed pl-3 border-l-2 border-amber-300"
                >
                  {w.text}
                  {w.evidence && (
                    <em className="block text-xs text-[var(--color-ink-muted)] mt-0.5 italic">
                      &ldquo;{w.evidence}&rdquo;
                    </em>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tips */}
        {c.tips.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
              <Lightbulb size={12} /> Tips
            </p>
            <ul className="space-y-1.5">
              {c.tips.map((t, i) => (
                <li
                  key={i}
                  className="text-sm text-[var(--color-ink-secondary)] leading-relaxed pl-3 border-l-2 border-blue-300"
                >
                  {t.text}
                  {t.example && (
                    <em className="block text-xs text-blue-600 mt-0.5 italic">
                      Example: &ldquo;{t.example}&rdquo;
                    </em>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

function VocabUpgradesSection({ items }: { items: VocabUpgrade[] }) {
  if (items.length === 0) return null;
  return (
    <details open className="group border border-[var(--color-line)] rounded-xl overflow-hidden">
      <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer select-none list-none hover:bg-[var(--color-surface-hover)] transition-colors bg-white">
        <Sparkles size={16} className="shrink-0 text-[var(--color-ink-muted)]" />
        <span className="text-sm font-semibold text-[var(--color-ink)] flex-1">Vocabulary Upgrades</span>
        <span className="text-xs text-[var(--color-ink-muted)] bg-[var(--color-surface)] border border-[var(--color-line)] rounded-full px-2 py-0.5">
          {items.length} words
        </span>
        <ChevronDown size={14} className="ml-1 text-[var(--color-ink-muted)] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="overflow-x-auto bg-white">
        <table className="w-full text-sm border-t border-[var(--color-line)]">
          <thead>
            <tr className="bg-[var(--color-surface)] text-xs text-[var(--color-ink-muted)]">
              <th className="text-left px-5 py-2 font-medium">Original</th>
              <th className="text-left px-5 py-2 font-medium">Replacements</th>
              <th className="text-left px-5 py-2 font-medium hidden sm:table-cell">Context</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {items.map((v, i) => (
              <tr key={i} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                <td className="px-5 py-2.5">
                  <span className="line-through text-red-500 font-medium">{v.original}</span>
                  {v.frequency > 1 && (
                    <span className="ml-1.5 text-xs text-[var(--color-ink-muted)]">&times;{v.frequency}</span>
                  )}
                </td>
                <td className="px-5 py-2.5">
                  <span className="font-semibold text-green-700">{v.upgrades.join(", ")}</span>
                </td>
                <td className="px-5 py-2.5 hidden sm:table-cell">
                  <em className="text-xs text-[var(--color-ink-muted)] not-italic">{v.context}</em>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function GrammarLogSection({ items }: { items: GrammarItem[] }) {
  if (items.length === 0) return null;
  return (
    <details open className="group border border-[var(--color-line)] rounded-xl overflow-hidden">
      <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer select-none list-none hover:bg-[var(--color-surface-hover)] transition-colors bg-white">
        <Search size={16} className="shrink-0 text-[var(--color-ink-muted)]" />
        <span className="text-sm font-semibold text-[var(--color-ink)] flex-1">Grammar Log</span>
        <span className="text-xs text-[var(--color-ink-muted)] bg-[var(--color-surface)] border border-[var(--color-line)] rounded-full px-2 py-0.5">
          {items.length} items
        </span>
        <ChevronDown size={14} className="ml-1 text-[var(--color-ink-muted)] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="divide-y divide-[var(--color-line)] bg-white">
        {items.map((g, i) => (
          <div key={i} className="px-5 py-3.5 space-y-1.5">
            <div className="flex items-center gap-2">
              {g.type === "error" ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                  <AlertCircle size={11} /> Error
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5">
                  <Sparkles size={11} /> Enhancement
                </span>
              )}
            </div>
            <div className="text-sm">
              <span className="text-[var(--color-ink-muted)] line-through">{g.original}</span>
            </div>
            <div className="text-sm font-semibold text-green-700">{g.corrected}</div>
            <div className="text-xs font-mono bg-[var(--color-surface)] border border-[var(--color-line)] rounded px-2 py-1 text-[var(--color-ink-muted)] inline-block">
              {g.rule}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function ParagraphAnalysisSection({ items }: { items: ParagraphAnalysis[] }) {
  if (items.length === 0) return null;
  const funcLabel: Record<ParagraphAnalysis["function"], string> = {
    introduction: "Introduction",
    body: "Body",
    conclusion: "Conclusion",
  };
  return (
    <details open className="group border border-[var(--color-line)] rounded-xl overflow-hidden">
      <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer select-none list-none hover:bg-[var(--color-surface-hover)] transition-colors bg-white">
        <AlignLeft size={16} className="shrink-0 text-[var(--color-ink-muted)]" />
        <span className="text-sm font-semibold text-[var(--color-ink)] flex-1">Paragraph Analysis</span>
        <ChevronDown size={14} className="ml-1 text-[var(--color-ink-muted)] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="divide-y divide-[var(--color-line)] bg-white">
        {items.map((p) => (
          <div key={p.index} className="flex items-start gap-3 px-5 py-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-line)] flex items-center justify-center text-xs font-bold text-[var(--color-ink-muted)]">
              {p.index}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-medium text-[var(--color-ink-muted)]">{funcLabel[p.function]}</span>
                {statusBadge(p.status)}
              </div>
              <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">{p.note}</p>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function ModelOutlineSection({ items }: { items: ModelOutlineItem[] }) {
  if (items.length === 0) return null;
  return (
    <details open className="group border border-[var(--color-line)] rounded-xl overflow-hidden">
      <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer select-none list-none hover:bg-[var(--color-surface-hover)] transition-colors bg-white">
        <ListOrdered size={16} className="shrink-0 text-[var(--color-ink-muted)]" />
        <span className="text-sm font-semibold text-[var(--color-ink)] flex-1">Model Outline</span>
        <ChevronDown size={14} className="ml-1 text-[var(--color-ink-muted)] group-open:rotate-180 transition-transform" />
      </summary>
      <div className="divide-y divide-[var(--color-line)] bg-white">
        {items.map((item) => (
          <div key={item.paragraph} className="flex items-start gap-4 px-5 py-3.5">
            <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--color-accent-light)] border border-[var(--color-accent)] flex items-center justify-center text-xs font-bold text-[var(--color-accent)]">
              {item.paragraph}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-2 mb-1">
                <span className="text-sm font-semibold text-[var(--color-ink)]">{item.goal}</span>
                <span className="text-xs text-[var(--color-ink-muted)]">&middot; {item.sentences} sentences</span>
              </div>
              <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">{item.content}</p>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

// ── Rich Feedback View ─────────────────────────────────────────────────────

function RichFeedbackView({ feedback }: { feedback: RichTeacherFeedback }) {
  const { essayMeta, criteria, vocabUpgrades, grammarLog, paragraphAnalysis, modelOutline, teacherComment } = feedback;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--color-line)] flex items-center gap-2">
        <GraduationCap size={18} className="text-[var(--color-accent)] shrink-0" />
        <h3 className="heading-sm">AI Teacher Feedback</h3>
        <span className="ml-auto text-xs text-[var(--color-ink-muted)] bg-[var(--color-surface)] border border-[var(--color-line)] rounded-full px-2 py-0.5 uppercase tracking-wide">
          {feedback.taskType === "task1" ? "Task 1" : "Task 2"}
        </span>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Essay Metrics */}
        {essayMeta && (
          <div className="flex gap-2 flex-wrap">
            <MetricCard value={essayMeta.wordCount} label="Words" />
            <MetricCard value={essayMeta.sentenceCount} label="Sentences" />
            <MetricCard value={essayMeta.paragraphCount} label="Paragraphs" />
            <MetricCard
              value={essayMeta.avgWordsPerSentence ? essayMeta.avgWordsPerSentence.toFixed(1) : "-"}
              label="Avg Words/Sentence"
            />
            <div className="flex flex-col items-center justify-center bg-white border border-[var(--color-line)] rounded-xl px-4 py-3 flex-1 min-w-0">
              {essayMeta.meetsWordRequirement ? (
                <>
                  <CheckCircle2 size={20} className="text-green-600" />
                  <span className="text-xs text-green-700 mt-0.5 text-center leading-tight">Meets word count</span>
                </>
              ) : (
                <>
                  <AlertCircle size={20} className="text-amber-600" />
                  <span className="text-xs text-amber-700 mt-0.5 text-center leading-tight">Under word count</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Criteria */}
        {criteria && criteria.length > 0 && (
          <div className="space-y-2">
            {criteria.map((c) => (
              <CriterionSection key={c.id} c={c} />
            ))}
          </div>
        )}

        {/* Vocab Upgrades */}
        {vocabUpgrades && vocabUpgrades.length > 0 && <VocabUpgradesSection items={vocabUpgrades} />}

        {/* Grammar Log */}
        {grammarLog && grammarLog.length > 0 && <GrammarLogSection items={grammarLog} />}

        {/* Paragraph Analysis */}
        {paragraphAnalysis && paragraphAnalysis.length > 0 && (
          <ParagraphAnalysisSection items={paragraphAnalysis} />
        )}

        {/* Model Outline */}
        {modelOutline && modelOutline.length > 0 && <ModelOutlineSection items={modelOutline} />}

        {/* Teacher Comment */}
        {teacherComment && (
          <div className="rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent-light)] px-5 py-4">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--color-accent)" }}>
              <MessageCircle size={13} /> Overall Teacher Comment
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-accent)" }}>
              {teacherComment}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Legacy Feedback View ───────────────────────────────────────────────────

function LegacyFeedbackView({ feedback }: { feedback: TeacherFeedback }) {
  const hasContent = LEGACY_SECTIONS.some((s) => feedback[s.key]?.trim());
  if (!hasContent) return null;

  return (
    <>
      <div className="px-5 py-4 border-b border-[var(--color-line)] flex items-center gap-2">
        <GraduationCap size={18} className="text-[var(--color-accent)] shrink-0" />
        <h3 className="heading-sm">AI Teacher Feedback</h3>
      </div>
      <div className="divide-y divide-[var(--color-line)]">
        {LEGACY_SECTIONS.map((section) => {
          const text = feedback[section.key]?.trim();
          if (!text) return null;
          const { Icon } = section;
          return (
            <details key={section.key} open className="group">
              <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer select-none list-none hover:bg-[var(--color-surface-hover)] transition-colors">
                <span style={{ color: section.color }} className="shrink-0 inline-flex">
                  <Icon size={16} />
                </span>
                <span className="text-sm font-semibold" style={{ color: section.color }}>
                  {section.label}
                </span>
                <ChevronDown
                  size={14}
                  className="ml-auto text-[var(--color-ink-muted)] group-open:rotate-180 transition-transform"
                />
              </summary>
              <div className="px-5 pb-4 pt-1">
                <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">{text}</p>
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────

export function TeacherFeedbackPanel({ feedback }: Props) {
  const isRich = "version" in feedback && feedback.version === 2;

  if (isRich) {
    return (
      <div className="card-base overflow-hidden">
        <RichFeedbackView feedback={feedback as RichTeacherFeedback} />
      </div>
    );
  }

  return (
    <div className="card-base overflow-hidden">
      <LegacyFeedbackView feedback={feedback as TeacherFeedback} />
    </div>
  );
}
