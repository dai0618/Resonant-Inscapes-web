"use client";

import { useCallback, useRef } from "react";
import { findNearestPromptPoint, pointerToVa } from "@/lib/inscape/nearestPoint";
import { PromptPoint } from "@/lib/types";

type VAMapProps = {
  points: PromptPoint[];
  selectedPointId?: string;
  onSelectPoint: (pointId: string) => void;
  variant?: "dots" | "touch";
};

const guides = [
  { label: "Joyful / Excited / Energetic", className: "right-3 top-3 text-right" },
  { label: "Calm / Peaceful / Warm", className: "right-3 bottom-3 text-right" },
  { label: "Tense / Chaotic / Intense", className: "left-3 top-3" },
  { label: "Sad / Lonely / Melancholic", className: "left-3 bottom-3" },
  { label: "Neutral", className: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" },
];

export default function VAMap({
  points,
  selectedPointId,
  onSelectPoint,
  variant = "dots",
}: VAMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  const selectedPoint = points.find((p) => p.id === selectedPointId) ?? points[0];

  const pickAtPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = mapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const { valence, arousal } = pointerToVa(clientX, clientY, rect);
      const nearest = findNearestPromptPoint(points, valence, arousal);
      if (nearest) onSelectPoint(nearest.id);
    },
    [onSelectPoint, points],
  );

  if (variant === "touch") {
    const v = selectedPoint
      ? Math.min(1, Math.max(0, Number.isFinite(selectedPoint.valence) ? selectedPoint.valence : 0))
      : 0.5;
    const a = selectedPoint
      ? Math.min(1, Math.max(0, Number.isFinite(selectedPoint.arousal) ? selectedPoint.arousal : 0))
      : 0.5;

    return (
      <div className="relative aspect-square w-full touch-none select-none">
        <div
          ref={mapRef}
          className="relative h-full w-full border border-[var(--ri-line)] bg-[var(--ri-bg-soft)]"
          onPointerDown={(e) => pickAtPointer(e.clientX, e.clientY)}
          onPointerMove={(e) => {
            if (e.buttons !== 1) return;
            pickAtPointer(e.clientX, e.clientY);
          }}
        >
          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px bg-[var(--ri-line)]" />
          <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full bg-[var(--ri-line)]" />
          <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.18em] text-[var(--ri-muted)]">
            Valence
          </span>
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] uppercase tracking-[0.18em] text-[var(--ri-muted)]">
            Arousal
          </span>
          {selectedPoint ? (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${v * 100}%`, top: `${(1 - a) * 100}%` }}
            >
              <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--ri-accent)]/50" />
              <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ri-accent)] shadow-[0_0_12px_var(--ri-accent)]" />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[var(--ri-line)] p-4">
      <div className="mb-3">
        <h3 className="text-sm font-light tracking-[0.12em] text-[var(--ri-text)]">Mood Map</h3>
      </div>
      <div className="relative aspect-square w-full border border-[var(--ri-line)] bg-[var(--ri-bg-soft)]">
        <div className="absolute left-1/2 top-0 h-full w-px bg-[var(--ri-line)]" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-[var(--ri-line)]" />
        {guides.map((guide) => (
          <span
            key={guide.label}
            className={`absolute text-[10px] leading-tight text-[var(--ri-muted)] ${guide.className}`}
          >
            {guide.label}
          </span>
        ))}
        {points.map((point, index) => {
          const pv = Number.isFinite(point.valence) ? Math.min(1, Math.max(0, point.valence)) : 0;
          const pa = Number.isFinite(point.arousal) ? Math.min(1, Math.max(0, point.arousal)) : 0;
          const isSelected = point.id === selectedPointId;
          return (
            <button
              key={`${point.id}-${index}`}
              type="button"
              style={{ left: `${pv * 100}%`, top: `${(1 - pa) * 100}%` }}
              onClick={() => onSelectPoint(point.id)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border transition ${
                isSelected
                  ? "h-3 w-3 border-[var(--ri-accent)] bg-[var(--ri-accent)]"
                  : "h-2 w-2 border-[var(--ri-line)] bg-transparent hover:border-[var(--ri-accent)]"
              }`}
              aria-label={`Select ${point.moodLabel}`}
            />
          );
        })}
      </div>
    </div>
  );
}
