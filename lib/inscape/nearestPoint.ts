import { PromptPoint } from "@/lib/types";

export function findNearestPromptPoint(
  points: PromptPoint[],
  valence: number,
  arousal: number,
): PromptPoint | undefined {
  if (points.length === 0) return undefined;

  let best = points[0]!;
  let bestDist = Infinity;

  for (const point of points) {
    const v = Number.isFinite(point.valence) ? point.valence : 0;
    const a = Number.isFinite(point.arousal) ? point.arousal : 0;
    const dist = (v - valence) ** 2 + (a - arousal) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = point;
    }
  }

  return best;
}

export function pointerToVa(clientX: number, clientY: number, rect: DOMRect): { valence: number; arousal: number } {
  const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
  return { valence: x, arousal: 1 - y };
}
