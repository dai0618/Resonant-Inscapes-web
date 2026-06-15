import { QUICK_CREATE_TRACKS } from "@/lib/quickCreate/trackSet";
import { ResonantProfile, SwipeResponse } from "@/lib/types";

const MIN_RESPONSES = 3;
const LIKED_WEIGHT = 1;
const DISLIKED_WEIGHT = -0.35;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function trackById(trackId: string) {
  return QUICK_CREATE_TRACKS.find((t) => t.id === trackId);
}

function vaProximityBoost(
  cardV: number,
  cardA: number,
  trackV: number,
  trackA: number,
): number {
  const dist = Math.hypot(cardV - trackV, cardA - trackA);
  return 1 + Math.max(0, 0.5 - dist);
}

function fallbackProfile(): ResonantProfile {
  const avgV = QUICK_CREATE_TRACKS.reduce((s, t) => s + t.valence, 0) / QUICK_CREATE_TRACKS.length;
  const avgA = QUICK_CREATE_TRACKS.reduce((s, t) => s + t.arousal, 0) / QUICK_CREATE_TRACKS.length;
  return {
    preferredValence: clamp01(avgV),
    preferredArousal: clamp01(avgA),
    valenceSpread: 0.35,
    arousalSpread: 0.35,
    sceneFamilyWeights: { "open cinematic landscape": 0.5, "urban night scene": 0.3 },
    tagWeights: { cinematic: 0.6, atmospheric: 0.5, moody: 0.4 },
    negativeTagWeights: { blurry: 0.5, "low quality": 0.5 },
    responseCount: 0,
  };
}

function addWeight(map: Record<string, number>, key: string, delta: number) {
  const k = key.trim().toLowerCase();
  if (!k) return;
  map[k] = (map[k] ?? 0) + delta;
}

function normalizeWeights(map: Record<string, number>): Record<string, number> {
  const entries = Object.entries(map).filter(([, v]) => v > 0);
  if (entries.length === 0) return {};
  const max = Math.max(...entries.map(([, v]) => v));
  const out: Record<string, number> = {};
  for (const [k, v] of entries) {
    out[k] = clamp01(v / max);
  }
  return out;
}

/**
 * Build a ResonantProfile from swipe responses via weighted aggregation.
 */
export function buildResonantProfile(responses: SwipeResponse[]): ResonantProfile {
  if (responses.length < MIN_RESPONSES) {
    return { ...fallbackProfile(), responseCount: responses.length };
  }

  let sumV = 0;
  let sumA = 0;
  let weightSum = 0;
  const likedV: number[] = [];
  const likedA: number[] = [];
  const sceneFamilyWeights: Record<string, number> = {};
  const tagWeights: Record<string, number> = {};
  const negativeTagWeights: Record<string, number> = {};

  for (const r of responses) {
    const track = trackById(r.trackId);
    const trackV = track?.valence ?? 0.5;
    const trackA = track?.arousal ?? 0.5;
    const proximity = vaProximityBoost(r.valence, r.arousal, trackV, trackA);
    const sign = r.liked ? LIKED_WEIGHT : DISLIKED_WEIGHT;
    const w = proximity * Math.abs(sign);

    if (r.liked) {
      sumV += r.valence * w;
      sumA += r.arousal * w;
      weightSum += w;
      likedV.push(r.valence);
      likedA.push(r.arousal);
    }

    const sceneDelta = r.liked ? w : w * 0.5;
    addWeight(sceneFamilyWeights, r.sceneFamily, sceneDelta);

    for (const tag of r.tags) {
      addWeight(tagWeights, tag, r.liked ? w : w * 0.4);
    }
    for (const tag of r.negativeTags) {
      addWeight(negativeTagWeights, tag, r.liked ? w * 0.3 : w * 0.6);
    }
  }

  const preferredValence = weightSum > 0 ? clamp01(sumV / weightSum) : 0.5;
  const preferredArousal = weightSum > 0 ? clamp01(sumA / weightSum) : 0.5;

  const valenceSpread =
    likedV.length > 1
      ? clamp01(
          Math.sqrt(likedV.reduce((s, v) => s + (v - preferredValence) ** 2, 0) / likedV.length) * 2,
        )
      : 0.25;
  const arousalSpread =
    likedA.length > 1
      ? clamp01(
          Math.sqrt(likedA.reduce((s, a) => s + (a - preferredArousal) ** 2, 0) / likedA.length) * 2,
        )
      : 0.25;

  return {
    preferredValence,
    preferredArousal,
    valenceSpread: Math.max(0.15, valenceSpread),
    arousalSpread: Math.max(0.15, arousalSpread),
    sceneFamilyWeights: normalizeWeights(sceneFamilyWeights),
    tagWeights: normalizeWeights(tagWeights),
    negativeTagWeights: normalizeWeights(negativeTagWeights),
    responseCount: responses.length,
  };
}

/** Human-friendly brightness / energy labels for Profile Summary. */
export function describeProfile(profile: ResonantProfile): { brightness: string; energy: string } {
  const brightness =
    profile.preferredValence >= 0.65
      ? "明るめ"
      : profile.preferredValence <= 0.35
        ? "落ち着いた・暗め"
        : "中間のトーン";
  const energy =
    profile.preferredArousal >= 0.65
      ? "エネルギッシュ"
      : profile.preferredArousal <= 0.35
        ? "静か・ゆったり"
        : "程よい熱量";
  return { brightness, energy };
}

export function topWeightedKeys(map: Record<string, number>, limit = 5): string[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}
