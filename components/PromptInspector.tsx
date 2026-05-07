import { PromptPoint } from "@/lib/types";

type PromptInspectorProps = {
  point?: PromptPoint;
};

export default function PromptInspector({ point }: PromptInspectorProps) {
  if (!point) {
    return (
      <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="mb-2 text-lg font-semibold text-zinc-950">Prompt Inspector</h3>
        <p className="text-sm text-zinc-800">Mood Map 上の点をクリックすると、このパネルに prompt・tags・negativeTags が表示されます。</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-lg font-semibold text-zinc-950">{point.moodLabel}</h3>
      <p className="mb-4 text-sm font-medium text-zinc-900">
        Valence {point.valence.toFixed(2)} / Arousal {point.arousal.toFixed(2)}
      </p>

      <section className="mb-4">
        <h4 className="mb-2 text-sm font-semibold text-zinc-950">Tags</h4>
        <div className="flex flex-wrap gap-2">
          {point.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-900">
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <h4 className="mb-2 text-sm font-semibold text-zinc-950">Prompt</h4>
        <p className="rounded-xl bg-zinc-100 p-3 text-sm font-medium leading-relaxed text-zinc-900">{point.prompt}</p>
      </section>

      <section>
        <h4 className="mb-2 text-sm font-semibold text-zinc-950">Negative Tags</h4>
        <div className="flex flex-wrap gap-2">
          {point.negativeTags.map((tag) => (
            <span key={tag} className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-100">
              {tag}
            </span>
          ))}
        </div>
      </section>
    </aside>
  );
}
