import { PromptPoint } from "@/lib/types";

type MobilePromptPanelProps = {
  point?: PromptPoint;
};

export default function MobilePromptPanel({ point }: MobilePromptPanelProps) {
  if (!point) {
    return (
      <div className="border-t border-[var(--ri-line)] px-1 pt-6">
        <p className="text-center text-sm text-[var(--ri-muted)]">Touch the map to explore</p>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--ri-line)] px-1 pt-6">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--ri-muted)]">{point.moodLabel}</p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--ri-text)]">{point.prompt}</p>
      {point.tags.length > 0 ? (
        <p className="mt-4 text-xs leading-relaxed text-[var(--ri-accent)]/90">{point.tags.join(" · ")}</p>
      ) : null}
      {point.negativeTags.length > 0 ? (
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--ri-muted)]">{point.negativeTags.join(" · ")}</p>
      ) : null}
    </div>
  );
}
