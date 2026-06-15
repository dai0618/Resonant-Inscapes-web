import { VA_EXPECTED_POINT_COUNT, VA_GRID_SIZE, VA_GRID_VALUES } from "@/lib/constants";
import { topWeightedKeys } from "@/lib/quickCreate/swipeScoring";
import { PromptPoint, ResonantProfile } from "@/lib/types";

const QUADRANT_SCENES: Record<string, string[]> = {
  hv_ha: ["festival lights street", "sunrise mountain peak", "colorful crowd energy", "neon dance floor"],
  hv_la: ["quiet garden morning", "soft beach horizon", "warm cafe interior", "gentle hillside meadow"],
  lv_ha: ["stormy industrial yard", "chaotic traffic intersection", "lightning over city", "crowded anxious hallway"],
  lv_la: ["empty rainy platform", "foggy lonely pier", "dim bedroom window", "abandoned winter field"],
};

const QUADRANT_TAGS: Record<string, string[]> = {
  hv_ha: ["vibrant", "dynamic", "uplifting", "energetic"],
  hv_la: ["serene", "warm", "soft", "peaceful"],
  lv_ha: ["tense", "dramatic", "gritty", "intense"],
  lv_la: ["melancholic", "quiet", "sparse", "lonely"],
};

const LIGHTING_BY_QUADRANT: Record<string, string> = {
  hv_ha: "bright neon and golden highlights",
  hv_la: "soft diffused warm light",
  lv_ha: "harsh contrast and strobing accents",
  lv_la: "low-key cool ambient light",
};

const TEXTURE_BY_QUADRANT: Record<string, string> = {
  hv_ha: "crisp saturated surfaces",
  hv_la: "gentle film grain and pastel softness",
  lv_ha: "gritty wet reflections",
  lv_la: "muted matte textures",
};

function quadrantKey(v: number, a: number): keyof typeof QUADRANT_SCENES {
  if (v >= 0.5 && a >= 0.5) return "hv_ha";
  if (v >= 0.5 && a < 0.5) return "hv_la";
  if (v < 0.5 && a >= 0.5) return "lv_ha";
  return "lv_la";
}

function moodLabel(v: number, a: number): string {
  const k = quadrantKey(v, a);
  if (k === "hv_ha") return "Joyful / Energetic";
  if (k === "hv_la") return "Peaceful / Warm";
  if (k === "lv_ha") return "Tense / Intense";
  return "Lonely / Quiet";
}

function vaDistance(v1: number, a1: number, v2: number, a2: number): number {
  return Math.hypot(v1 - v2, a1 - a2);
}

function pickSceneFamily(
  profile: ResonantProfile,
  cellV: number,
  cellA: number,
  index: number,
): string {
  const dist = vaDistance(cellV, cellA, profile.preferredValence, profile.preferredArousal);
  const proximity = 1 - Math.min(1, dist / Math.SQRT2);
  const topScenes = topWeightedKeys(profile.sceneFamilyWeights, 8);
  const qk = quadrantKey(cellV, cellA);
  const fallback = QUADRANT_SCENES[qk]!;

  if (topScenes.length > 0 && proximity > 0.35) {
    const sceneIndex = Math.floor((index + proximity * 10) % topScenes.length);
    return topScenes[sceneIndex]!;
  }
  return fallback[index % fallback.length]!;
}

function pickTags(
  profile: ResonantProfile,
  cellV: number,
  cellA: number,
  visualStyle: string,
  index: number,
): string[] {
  const dist = vaDistance(cellV, cellA, profile.preferredValence, profile.preferredArousal);
  const proximity = 1 - Math.min(1, dist / Math.SQRT2);
  const qk = quadrantKey(cellV, cellA);
  const base = [...QUADRANT_TAGS[qk]!];
  const profileTags = topWeightedKeys(profile.tagWeights, 6);

  const tags: string[] = [];
  if (proximity > 0.4 && profileTags.length > 0) {
    tags.push(...profileTags.slice(0, 2 + Math.floor(proximity * 3)));
  } else {
    tags.push(base[index % base.length]!, base[(index + 1) % base.length]!);
  }

  if (visualStyle.trim()) {
    tags.push(...visualStyle.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 2));
  }

  return [...new Set(tags)].slice(0, 8);
}

function pickNegativeTags(profile: ResonantProfile, index: number): string[] {
  const fromProfile = topWeightedKeys(profile.negativeTagWeights, 4);
  const defaults = ["blurry", "low quality", "text watermark", "deformed"];
  const merged = [...fromProfile, ...defaults];
  return [...new Set(merged)].slice(index % 2, (index % 2) + 4);
}

function buildPrompt(
  sceneFamily: string,
  mood: string,
  cellV: number,
  cellA: number,
  tags: string[],
  visualStyle: string,
): string {
  const qk = quadrantKey(cellV, cellA);
  const lighting = LIGHTING_BY_QUADRANT[qk];
  const texture = TEXTURE_BY_QUADRANT[qk];
  const tagLine = tags.slice(0, 4).join(", ");
  const style = visualStyle.trim() || "cinematic";
  return `${sceneFamily}, ${mood.toLowerCase()}, ${lighting}, ${texture}, ${tagLine}, ${style}, single coherent frame, high detail`;
}

export type ProfileToPromptListInput = {
  profile: ResonantProfile;
  promptListId: string;
  visualStyle: string;
};

/**
 * Generate exactly 100 PromptPoints on the 10×10 VA grid from a ResonantProfile.
 */
export function profileToPromptList(input: ProfileToPromptListInput): PromptPoint[] {
  const { profile, promptListId, visualStyle } = input;
  const points: PromptPoint[] = [];
  let index = 0;

  for (let yi = 0; yi < VA_GRID_SIZE; yi += 1) {
    for (let xi = 0; xi < VA_GRID_SIZE; xi += 1) {
      const valence = VA_GRID_VALUES[xi]!;
      const arousal = VA_GRID_VALUES[yi]!;
      const sceneFamily = pickSceneFamily(profile, valence, arousal, index);
      const mood = moodLabel(valence, arousal);
      const tags = pickTags(profile, valence, arousal, visualStyle, index);
      const negativeTags = pickNegativeTags(profile, index);
      const prompt = buildPrompt(sceneFamily, mood, valence, arousal, tags, visualStyle);

      points.push({
        id: `qc-${index}-v${valence}-a${arousal}`,
        promptListId,
        valence,
        arousal,
        moodLabel: mood,
        tags,
        negativeTags,
        prompt,
        sceneFamily,
      });
      index += 1;
    }
  }

  if (points.length !== VA_EXPECTED_POINT_COUNT) {
    throw new Error(`Expected ${VA_EXPECTED_POINT_COUNT} points, got ${points.length}`);
  }

  return points;
}
