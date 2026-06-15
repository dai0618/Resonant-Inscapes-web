import { VA_EXPECTED_POINT_COUNT, VA_GRID_SIZE, VA_GRID_VALUES } from "@/lib/constants";
import { PromptGenerationRequest, PromptPoint, QuadrantInput, QuadrantKey } from "@/lib/types";

export type CornerSeed = {
  tags: string[];
  corePrompt: string;
  negativeTags: string[];
  /** Visual scene / place families for this quadrant (not bilinear-blended; used for per-cell diversity). */
  sceneFamilies: string[];
  colorPalette: string[];
  lightingTags: string[];
  textureTags: string[];
};

const DEFAULT_SCENE_FAMILIES: Record<QuadrantKey, string[]> = {
  highValenceHighArousal: [
    "festival lights and crowd energy",
    "bright neon city at night",
    "colorful sunset sky with clouds",
    "dance floor reflections",
    "fireworks over water",
    "sunlit busy street market",
    "dynamic abstract color ribbons",
  ],
  highValenceLowArousal: [
    "calm lake or seaside horizon",
    "sunlit bedroom with window light",
    "quiet meadow and soft grass",
    "nostalgic small-town street",
    "soft pastel sky and clouds",
    "garden path with flowers",
    "warm interior reading nook",
  ],
  lowValenceHighArousal: [
    "stormy sea and crashing waves",
    "distorted urban reflections",
    "dark tangled forest edge",
    "industrial hall and metal structures",
    "sharp shadow corridors",
    "emergency lights in rain",
    "chaotic abstract fractured forms",
  ],
  lowValenceLowArousal: [
    "empty wet street at night",
    "foggy distant hills",
    "dim sparse room",
    "rain-streaked window view",
    "abandoned station platform",
    "winter field under grey sky",
    "distant city lights through haze",
  ],
};

function tokenizeExtraScenes(quad: QuadrantInput): string[] {
  const parts = [quad.place, quad.userInput]
    .filter(Boolean)
    .flatMap((s) => s.split(/[,、]/))
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && t.length < 80);
  return [...new Set(parts.map((t) => t.toLowerCase()))].slice(0, 4);
}

function splitToTags(field: string, fallback: string[]): string[] {
  if (!field?.trim()) return [...fallback];
  const parts = field
    .split(/[,、]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
  return parts.length ? parts : [...fallback];
}

export const QUADRANT_KEYS: QuadrantKey[] = [
  "highValenceHighArousal",
  "highValenceLowArousal",
  "lowValenceHighArousal",
  "lowValenceLowArousal",
];

/**
 * Psychological VA in [-0.5, +0.5] (pleasant right, energy up) maps to app grid [0,1]×[0,1].
 * Anchors: (+0.5,+0.5)→(1,1) joyful, (+0.5,-0.5)→(1,0) peaceful, (-0.5,+0.5)→(0,1) tense, (-0.5,-0.5)→(0,0) lonely.
 * Bilinear weights at (V,A) in [0,1]:
 */
export function bilinearCornerWeights(valence01: number, arousal01: number): Record<QuadrantKey, number> {
  const V = valence01;
  const A = arousal01;
  return {
    highValenceHighArousal: V * A,
    highValenceLowArousal: V * (1 - A),
    lowValenceHighArousal: (1 - V) * A,
    lowValenceLowArousal: (1 - V) * (1 - A),
  };
}

function pickMoodLabel(valence: number, arousal: number): string {
  if (valence >= 0.5 && arousal >= 0.5) return "Joyful / Energetic";
  if (valence >= 0.5 && arousal < 0.5) return "Peaceful / Warm";
  if (valence < 0.5 && arousal >= 0.5) return "Tense / Intense";
  return "Lonely / Quiet";
}

function splitAvoid(avoid: string): string[] {
  if (!avoid.trim()) return ["blurry", "low quality", "inconsistent style"];
  return avoid
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function uniquePush(arr: string[], value: string, max: number) {
  if (value && !arr.includes(value) && arr.length < max) arr.push(value);
}

/** Blend tags from corners using weights (deterministic, English-oriented). */
export function blendTags(
  weights: Record<QuadrantKey, number>,
  seeds: Record<QuadrantKey, CornerSeed>,
  visualStyle: string,
): string[] {
  const sorted = QUADRANT_KEYS.map((k) => ({ k, w: weights[k] })).sort((a, b) => b.w - a.w);
  const out: string[] = [];
  const styleWords = visualStyle
    .split(/[\s,]+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .slice(0, 3);
  for (const w of styleWords) uniquePush(out, w.toLowerCase(), 8);

  for (let round = 0; round < 12 && out.length < 8; round += 1) {
    for (const { k, w } of sorted) {
      if (w < 0.05 || out.length >= 8) continue;
      const pool = seeds[k].tags.length ? seeds[k].tags : ["abstract"];
      const tag = pool[round % pool.length];
      uniquePush(out, String(tag).toLowerCase(), 8);
    }
  }
  return out.length ? out : ["cinematic", "abstract", "mood-driven"];
}

export function blendNegativeTags(weights: Record<QuadrantKey, number>, seeds: Record<QuadrantKey, CornerSeed>): string[] {
  const out: string[] = [];
  for (const { k, w } of QUADRANT_KEYS.map((key) => ({ k: key, w: weights[key] })).sort((a, b) => b.w - a.w)) {
    if (w < 0.12) continue;
    for (const t of seeds[k].negativeTags) {
      uniquePush(out, String(t).toLowerCase(), 10);
    }
  }
  return out.length ? out : ["blurry", "low quality"];
}

function blendPrompt(weights: Record<QuadrantKey, number>, seeds: Record<QuadrantKey, CornerSeed>, tags: string[]): string {
  const sorted = QUADRANT_KEYS.map((k) => ({ k, w: weights[k] })).filter((x) => x.w >= 0.18).sort((a, b) => b.w - a.w);
  const primary = sorted[0];
  const secondary = sorted[1];
  const tagStr = tags.slice(0, 6).join(", ");
  if (!primary) return `${tagStr}, music-responsive still frame, cohesive look.`;
  const a = seeds[primary.k].corePrompt.trim();
  if (secondary && secondary.k !== primary.k) {
    const b = seeds[secondary.k].corePrompt.trim();
    return `${tagStr}, ${a} Blending toward ${b}. Single coherent frame, no collage.`;
  }
  return `${tagStr}, ${a} Single coherent frame.`;
}

/** Local English-ish seeds when OpenAI is unavailable (may still contain non-English if user typed JP). */
export function localCornerSeedsFromQuadrants(input: PromptGenerationRequest): Record<QuadrantKey, CornerSeed> {
  const style = input.visualStyle || "cinematic";
  const mk = (quad: QuadrantInput, key: QuadrantKey): CornerSeed => {
    const tags = [
      style,
      quad.color,
      quad.lighting,
      quad.place,
      quad.texture,
      quad.userInput,
    ]
      .flatMap((part) =>
        part
          ? part
              .split(/[,、]/)
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 2)
          : [],
      )
      .map((t) => t.toLowerCase().replace(/\s+/g, " "))
      .filter(Boolean)
      .slice(0, 8);

    const corePrompt = [quad.userInput, quad.place, quad.lighting, quad.color, quad.texture]
      .filter(Boolean)
      .join(", ")
      .slice(0, 280);

    const sceneFamilies = [...new Set([...DEFAULT_SCENE_FAMILIES[key], ...tokenizeExtraScenes(quad)])].slice(0, 12);

    return {
      tags: tags.length ? tags : [style, "abstract", "music visualization"],
      corePrompt: corePrompt || `${style} abstract mood, soft continuity across VA space.`,
      negativeTags: splitAvoid(quad.avoid),
      sceneFamilies: sceneFamilies.length ? sceneFamilies : [...DEFAULT_SCENE_FAMILIES[key]],
      colorPalette: splitToTags(quad.color, ["muted palette", "balanced tones"]),
      lightingTags: splitToTags(quad.lighting, ["soft ambient light"]),
      textureTags: splitToTags(quad.texture, ["subtle film grain"]),
    };
  };

  return {
    highValenceHighArousal: mk(input.quadrants.highValenceHighArousal, "highValenceHighArousal"),
    highValenceLowArousal: mk(input.quadrants.highValenceLowArousal, "highValenceLowArousal"),
    lowValenceHighArousal: mk(input.quadrants.lowValenceHighArousal, "lowValenceHighArousal"),
    lowValenceLowArousal: mk(input.quadrants.lowValenceLowArousal, "lowValenceLowArousal"),
  };
}

/** Build all 100 grid points from four corner seeds (fast, no LLM per cell). */
export function expandGridFromCornerSeeds(
  seeds: Record<QuadrantKey, CornerSeed>,
  visualStyle: string,
): PromptPoint[] {
  const gridValues = VA_GRID_VALUES;
  const points: PromptPoint[] = [];
  for (let yi = 0; yi < VA_GRID_SIZE; yi += 1) {
    for (let xi = 0; xi < VA_GRID_SIZE; xi += 1) {
      const valence = gridValues[xi];
      const arousal = gridValues[yi];
      const w = bilinearCornerWeights(valence, arousal);
      const tags = blendTags(w, seeds, visualStyle);
      const negativeTags = blendNegativeTags(w, seeds);
      const prompt = blendPrompt(w, seeds, tags);
      const moodLabel = pickMoodLabel(valence, arousal);
      const id = `v${String(valence).replace(".", "d")}-a${String(arousal).replace(".", "d")}-${xi}-${yi}`;
      points.push({
        id,
        promptListId: "",
        valence,
        arousal,
        moodLabel,
        tags,
        negativeTags,
        prompt,
      });
    }
  }
  if (points.length !== VA_EXPECTED_POINT_COUNT) {
    throw new Error(`expandGrid expected ${VA_EXPECTED_POINT_COUNT} points, got ${points.length}`);
  }
  return points;
}
