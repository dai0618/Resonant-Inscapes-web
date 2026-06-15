import { VA_EXPECTED_POINT_COUNT, VA_GRID_SIZE, VA_GRID_VALUES } from "@/lib/constants";
import {
  bilinearCornerWeights,
  blendNegativeTags,
  blendTags,
  CornerSeed,
  QUADRANT_KEYS,
} from "@/lib/cornerExpansion";
import { cellRng, combineSeed } from "@/lib/seededRandom";
import { PromptGenerationRequest, PromptPoint, QuadrantKey } from "@/lib/types";

const COMPOSITION_POOL = [
  "wide establishing shot",
  "medium shot",
  "close-up detail",
  "silhouette against light",
  "aerial perspective",
  "rule of thirds framing",
  "symmetrical composition",
  "leading lines into depth",
  "shallow depth of field",
  "environmental portrait space",
  "negative space emphasis",
  "corner-weighted framing",
  "low angle",
  "high angle",
  "single focal subject",
  "layered depth planes",
];

const SUBJECT_POOL = [
  "no people",
  "distant lone figure",
  "architectural forms",
  "organic shapes",
  "urban geometry",
  "natural elements",
  "abstract forms",
  "textured surfaces",
];

const QUALITY_TAGS = ["single coherent frame", "high detail", "music-responsive mood"];

const ALT_LIGHTING = ["rim light accent", "diffused skylight", "practical lamps", "cool fill", "warm key"];
const ALT_COMP = ["diagonal framing", "centered subject", "off-center balance", "foreground occlusion"];

function pickMoodLabel(valence: number, arousal: number): string {
  if (valence >= 0.5 && arousal >= 0.5) return "Joyful / Energetic";
  if (valence >= 0.5 && arousal < 0.5) return "Peaceful / Warm";
  if (valence < 0.5 && arousal >= 0.5) return "Tense / Intense";
  return "Lonely / Quiet";
}

function jaccardTags(a: string[], b: string[]): number {
  const A = new Set(a.map((t) => t.toLowerCase()));
  const B = new Set(b.map((t) => t.toLowerCase()));
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  for (const x of A) {
    if (B.has(x)) inter += 1;
  }
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function postProcessDedupePoints(points: PromptPoint[], input: PromptGenerationRequest): PromptPoint[] {
  const out = points.map((p) => ({ ...p }));
  const base = combineSeed([input.title, input.description, input.visualStyle, "dedupe"]);

  for (let round = 0; round < 8; round += 1) {
    const byPrompt = new Map<string, number[]>();
    for (let i = 0; i < out.length; i += 1) {
      const pr = out[i]!.prompt;
      const arr = byPrompt.get(pr) ?? [];
      arr.push(i);
      byPrompt.set(pr, arr);
    }

    let dupLeft = 0;
    for (const [, idx] of byPrompt) {
      if (idx.length <= 1) continue;
      dupLeft += idx.length - 1;
      for (let k = 1; k < idx.length; k += 1) {
        const j = idx[k]!;
        const alt = ALT_COMP[(base + j + round * 17) % ALT_COMP.length]!;
        out[j] = { ...out[j]!, prompt: `${out[j]!.prompt}, ${alt}` };
      }
    }

    const familyCounts = new Map<string, number[]>();
    for (let i = 0; i < out.length; i += 1) {
      const sf = out[i]!.sceneFamily ?? "";
      if (!sf) continue;
      const arr = familyCounts.get(sf) ?? [];
      arr.push(i);
      familyCounts.set(sf, arr);
    }

    const maxFamily = Math.max(18, Math.floor(VA_EXPECTED_POINT_COUNT * 0.24));
    for (const [fam, idx] of familyCounts) {
      if (idx.length <= maxFamily) continue;
      const excess = idx.slice(maxFamily).sort((a, b) => a - b);
      for (let e = 0; e < excess.length; e += 1) {
        const i = excess[e]!;
        const altLight = ALT_LIGHTING[(base + i + round + e) % ALT_LIGHTING.length]!;
        out[i] = {
          ...out[i]!,
          sceneFamily: `${fam} (alt ${e + 1})`,
          prompt: `${out[i]!.prompt}, ${altLight}`,
        };
      }
    }

    for (let i = 0; i < out.length; i += 1) {
      const xi = i % VA_GRID_SIZE;
      const yi = Math.floor(i / VA_GRID_SIZE);
      const p = out[i]!;
      const neighbors: number[] = [];
      if (xi > 0) neighbors.push(i - 1);
      if (xi < VA_GRID_SIZE - 1) neighbors.push(i + 1);
      if (yi > 0) neighbors.push(i - VA_GRID_SIZE);
      if (yi < VA_GRID_SIZE - 1) neighbors.push(i + VA_GRID_SIZE);
      for (const j of neighbors) {
        if (jaccardTags(p.tags, out[j]!.tags) > 0.88) {
          const tweak = `va-tone-${(base + i + j + round) % 127}`;
          if (!out[i]!.tags.includes(tweak)) {
            out[i] = { ...out[i]!, tags: [...out[i]!.tags, tweak].slice(0, 9) };
          }
        }
      }
    }

    if (dupLeft === 0) break;
  }

  return out;
}

function blendColorPalette(
  weights: Record<QuadrantKey, number>,
  seeds: Record<QuadrantKey, CornerSeed>,
  rng: () => number,
  maxOut: number,
): string[] {
  const sorted = QUADRANT_KEYS.map((k) => ({ k, w: weights[k] })).sort((a, b) => b.w - a.w);
  const out: string[] = [];
  for (const { k, w } of sorted) {
    if (w < 0.08 || out.length >= maxOut) continue;
    const pool = seeds[k].colorPalette;
    if (!pool.length) continue;
    const pick = pool[Math.floor(rng() * pool.length)]!;
    if (!out.includes(pick)) out.push(pick);
  }
  if (out.length === 0) out.push("muted tones");
  return out.slice(0, maxOut);
}

function blendCornerStringTags(
  weights: Record<QuadrantKey, number>,
  seeds: Record<QuadrantKey, CornerSeed>,
  key: "lightingTags" | "textureTags",
  rng: () => number,
  maxOut: number,
): string[] {
  const sorted = QUADRANT_KEYS.map((k) => ({ k, w: weights[k] })).sort((a, b) => b.w - a.w);
  const out: string[] = [];
  for (const { k, w } of sorted) {
    if (w < 0.06 || out.length >= maxOut) continue;
    const pool = seeds[k][key];
    for (let r = 0; r < 3 && out.length < maxOut; r += 1) {
      if (!pool.length) break;
      const pick = pool[Math.floor(rng() * pool.length)]!;
      if (!out.includes(pick)) out.push(pick);
    }
  }
  if (out.length === 0) {
    out.push(key === "lightingTags" ? "soft light" : "fine texture");
  }
  return out.slice(0, maxOut);
}

function pickSceneFamily(
  xi: number,
  yi: number,
  valence: number,
  arousal: number,
  weights: Record<QuadrantKey, number>,
  seeds: Record<QuadrantKey, CornerSeed>,
  input: PromptGenerationRequest,
  familyCounts: Map<string, number>,
  neighborFamilies: Set<string>,
): string {
  const rng = cellRng(input, xi, yi, valence, arousal, "scene-family");
  type Cand = { family: string; base: number };
  const cand: Cand[] = [];
  for (const k of QUADRANT_KEYS) {
    for (const raw of seeds[k].sceneFamilies) {
      const f = raw.trim();
      if (!f) continue;
      cand.push({ family: f, base: weights[k] });
    }
  }
  if (cand.length === 0) {
    return "abstract atmospheric space";
  }

  const maxAllowed = Math.max(14, Math.ceil(VA_EXPECTED_POINT_COUNT / Math.max(4, cand.length / 4)));

  const scored = cand.map((c) => {
    const count = familyCounts.get(c.family) ?? 0;
    const neighborPenalty = neighborFamilies.has(c.family) ? 35 : 0;
    const overloadPenalty = count > maxAllowed ? (count - maxAllowed) * 12 : 0;
    return {
      family: c.family,
      score: c.base * 110 - neighborPenalty - overloadPenalty + rng() * 14,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.min(12, scored.length));
  const pick = top[Math.floor(rng() * top.length)]!;
  return pick.family;
}

function pickComposition(xi: number, yi: number, v: number, a: number, input: PromptGenerationRequest): string {
  const rng = cellRng(input, xi, yi, v, a, "composition");
  return COMPOSITION_POOL[Math.floor(rng() * COMPOSITION_POOL.length)]!;
}

function pickSubjectFragment(xi: number, yi: number, v: number, a: number, input: PromptGenerationRequest): string {
  const rng = cellRng(input, xi, yi, v, a, "subject");
  return SUBJECT_POOL[Math.floor(rng() * SUBJECT_POOL.length)]!;
}

function assemblePrompt(parts: {
  moodTags: string[];
  sceneFamily: string;
  lightingTags: string[];
  colorTags: string[];
  textureTags: string[];
  composition: string;
  subjectHint: string;
}): string {
  const mood = parts.moodTags.slice(0, 6).join(", ");
  const lit = parts.lightingTags.join(", ");
  const col = parts.colorTags.join(", ");
  const tex = parts.textureTags.join(", ");
  const qual = QUALITY_TAGS.join(", ");
  return [mood, parts.sceneFamily, lit, col, tex, parts.composition, parts.subjectHint, qual].filter(Boolean).join(", ");
}

/** 100 points: bilinear mood/color/lighting/texture; scene/composition/subject from families with seeded diversity. */
export function generateDiverseGridFromCornerSeeds(
  seeds: Record<QuadrantKey, CornerSeed>,
  input: PromptGenerationRequest,
): PromptPoint[] {
  const visualStyle = input.visualStyle || "cinematic";
  const familyCounts = new Map<string, number>();
  const assigned: (string | undefined)[][] = Array.from({ length: VA_GRID_SIZE }, () =>
    Array.from({ length: VA_GRID_SIZE }, () => undefined),
  );

  const points: PromptPoint[] = [];
  for (let yi = 0; yi < VA_GRID_SIZE; yi += 1) {
    for (let xi = 0; xi < VA_GRID_SIZE; xi += 1) {
      const valence = VA_GRID_VALUES[xi]!;
      const arousal = VA_GRID_VALUES[yi]!;
      const w = bilinearCornerWeights(valence, arousal);
      const rng = cellRng(input, xi, yi, valence, arousal, "blend");

      const moodTags = blendTags(w, seeds, visualStyle);
      const colorTags = blendColorPalette(w, seeds, rng, 4);
      const lightingTags = blendCornerStringTags(w, seeds, "lightingTags", rng, 4);
      const textureTags = blendCornerStringTags(w, seeds, "textureTags", rng, 4);
      const negativeTags = blendNegativeTags(w, seeds);

      const neighborFamilies = new Set<string>();
      if (xi > 0) {
        const prev = assigned[yi]![xi - 1];
        if (prev) neighborFamilies.add(prev);
      }
      if (yi > 0) {
        const above = assigned[yi - 1]![xi];
        if (above) neighborFamilies.add(above);
      }

      const sceneFamily = pickSceneFamily(xi, yi, valence, arousal, w, seeds, input, familyCounts, neighborFamilies);
      familyCounts.set(sceneFamily, (familyCounts.get(sceneFamily) ?? 0) + 1);
      assigned[yi]![xi] = sceneFamily;

      const composition = pickComposition(xi, yi, valence, arousal, input);
      const subjectHint = pickSubjectFragment(xi, yi, valence, arousal, input);
      const prompt = assemblePrompt({
        moodTags,
        sceneFamily,
        lightingTags,
        colorTags,
        textureTags,
        composition,
        subjectHint,
      });

      const tagSet = [...new Set([...moodTags.slice(0, 5), ...colorTags.slice(0, 2), ...lightingTags.slice(0, 2)])].slice(
        0,
        8,
      );

      const id = `div-v${valence.toFixed(3)}-a${arousal.toFixed(3)}-${xi}-${yi}`;
      points.push({
        id,
        promptListId: "",
        valence,
        arousal,
        moodLabel: pickMoodLabel(valence, arousal),
        tags: tagSet,
        negativeTags,
        prompt,
        sceneFamily,
      });
    }
  }

  if (points.length !== VA_EXPECTED_POINT_COUNT) {
    throw new Error(`diverse grid expected ${VA_EXPECTED_POINT_COUNT} points`);
  }
  return postProcessDedupePoints(points, input);
}
