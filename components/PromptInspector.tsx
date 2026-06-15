import { PromptPoint } from "@/lib/types";

type PromptInspectorProps = {
  point?: PromptPoint;
};

export default function PromptInspector({ point }: PromptInspectorProps) {
  if (!point) {
    return (
      <aside className="border-t border-[var(--ri-line)] pt-6">
        <p className="text-sm text-[var(--ri-muted)]">Touch the map to explore a prompt.</p>
      </aside>
    );
  }

  return (
    <aside className="border-t border-[var(--ri-line)] pt-6">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--ri-muted)]">{point.moodLabel}</p>
      {point.sceneFamily ? (
        <p className="mt-2 text-xs text-[var(--ri-muted)]">{point.sceneFamily}</p>
      ) : null}
      <p className="mt-3 text-sm leading-relaxed text-[var(--ri-text)]">{point.prompt}</p>
      {point.tags.length > 0 ? (
        <p className="mt-4 text-xs text-[var(--ri-accent)]/90">{point.tags.join(" · ")}</p>
      ) : null}
      {point.negativeTags.length > 0 ? (
        <p className="mt-2 text-[11px] text-[var(--ri-muted)]">{point.negativeTags.join(" · ")}</p>
      ) : null}
    </aside>
  );
}
