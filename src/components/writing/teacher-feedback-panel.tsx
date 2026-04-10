import type { TeacherFeedback } from "@/lib/types";

const SECTIONS: {
  key: keyof TeacherFeedback;
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: "logic", label: "Lập luận & Tư duy", icon: "🧠", color: "#6366f1" },
  { key: "structure", label: "Cấu trúc bài viết", icon: "📐", color: "#0ea5e9" },
  { key: "grammar", label: "Ngữ pháp", icon: "✏️", color: "#f59e0b" },
  { key: "vocab", label: "Từ vựng", icon: "📚", color: "#10b981" },
  { key: "enhancement", label: "Cần cải thiện", icon: "🎯", color: "#993556" },
];

interface TeacherFeedbackPanelProps {
  feedback: TeacherFeedback;
}

export function TeacherFeedbackPanel({ feedback }: TeacherFeedbackPanelProps) {
  const hasContent = SECTIONS.some((s) => feedback[s.key]?.trim());
  if (!hasContent) return null;

  return (
    <div className="card-base overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-line)] flex items-center gap-2">
        <span className="text-base">👩‍🏫</span>
        <h3 className="heading-sm">Nhận xét của giáo viên AI</h3>
      </div>
      <div className="divide-y divide-[var(--color-line)]">
        {SECTIONS.map((section) => {
          const text = feedback[section.key]?.trim();
          if (!text) return null;
          return (
            <details key={section.key} open className="group">
              <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer select-none list-none hover:bg-[var(--color-surface-hover)] transition-colors">
                <span className="text-base shrink-0">{section.icon}</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: section.color }}
                >
                  {section.label}
                </span>
                <span className="ml-auto text-xs text-[var(--color-ink-muted)] group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <div className="px-5 pb-4 pt-1">
                <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">
                  {text}
                </p>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
