"use client";

import { PromptPoint } from "@/lib/types";

type VAMapProps = {
  points: PromptPoint[];
  selectedPointId?: string;
  onSelectPoint: (pointId: string) => void;
};

const guides = [
  { label: "Joyful / Excited / Energetic", className: "right-3 top-3 text-right" },
  { label: "Calm / Peaceful / Warm", className: "right-3 bottom-3 text-right" },
  { label: "Tense / Chaotic / Intense", className: "left-3 top-3" },
  { label: "Sad / Lonely / Melancholic", className: "left-3 bottom-3" },
  { label: "Neutral", className: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" },
];

export default function VAMap({ points, selectedPointId, onSelectPoint }: VAMapProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-950">Mood Map</h3>
          <p className="text-xs font-medium text-zinc-800">VA (Valence–Arousal) 座標</p>
        </div>
        <p className="text-xs font-semibold text-zinc-900">点をクリックして詳細を表示</p>
      </div>
      <div className="relative aspect-square w-full rounded-xl border border-zinc-300 bg-zinc-50">
        <div className="absolute left-1/2 top-0 h-full w-px bg-zinc-300" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-zinc-300" />
        {guides.map((guide) => (
          <span key={guide.label} className={`absolute text-[10px] font-semibold leading-tight text-zinc-800 ${guide.className}`}>
            {guide.label}
          </span>
        ))}
        {points.map((point, index) => {
          const v = Number.isFinite(point.valence) ? Math.min(1, Math.max(0, point.valence)) : 0;
          const a = Number.isFinite(point.arousal) ? Math.min(1, Math.max(0, point.arousal)) : 0;
          const left = `${v * 100}%`;
          const top = `${(1 - a) * 100}%`;
          const isSelected = point.id === selectedPointId;
          return (
            <button
              key={`${point.id}-${index}`}
              type="button"
              style={{ left, top }}
              onClick={() => onSelectPoint(point.id)}
              title={`${point.moodLabel} (V=${v}, A=${a})`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition ${
                isSelected
                  ? "h-3.5 w-3.5 border-zinc-900 bg-zinc-900 shadow-md"
                  : "h-2.5 w-2.5 border-zinc-500 bg-white hover:border-zinc-900 hover:bg-zinc-900"
              }`}
              aria-label={`Select ${point.moodLabel}`}
            />
          );
        })}
        <div className="pointer-events-none absolute inset-x-3 bottom-1 text-center text-xs font-semibold text-zinc-900">
          Valence: Unpleasant → Pleasant
        </div>
        <div className="pointer-events-none absolute inset-y-3 left-1 -rotate-90 text-xs font-semibold text-zinc-900">
          Arousal: Low → High energy
        </div>
      </div>
    </div>
  );
}
