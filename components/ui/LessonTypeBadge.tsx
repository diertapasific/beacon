import { Icon } from "./Icon";

const TYPE_META: Record<string, { label: string; icon: string }> = {
  concept_card: { label: "Concept", icon: "Lightbulb" },
  analogy: { label: "Analogy", icon: "Brain" },
  code_snippet: { label: "Code", icon: "Code" },
  myth_vs_reality: { label: "Myth vs Reality", icon: "Question" },
  did_you_know: { label: "Did You Know", icon: "Sparkle" },
  flashcard: { label: "Flashcard", icon: "Repeat" },
};

export function lessonTypeLabel(type: string): string {
  return TYPE_META[type]?.label ?? "Lesson";
}

export function LessonTypeBadge({ type, className = "" }: { type: string; className?: string }) {
  const meta = TYPE_META[type] ?? { label: "Lesson", icon: "Lightbulb" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 border-line bg-sun-tint text-ink
        px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide ${className}`}
    >
      <Icon name={meta.icon} size={13} weight="bold" />
      {meta.label}
    </span>
  );
}
