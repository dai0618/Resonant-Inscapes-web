import OpenAI from "openai";
import { VA_EXPECTED_POINT_COUNT, VA_GRID_VALUES } from "@/lib/constants";
import { CornerSeed, QUADRANT_KEYS, expandGridFromCornerSeeds } from "@/lib/cornerExpansion";
import { PromptPoint, PromptGenerationRequest, QuadrantKey } from "@/lib/types";

export type RawGridPoint = {
  valence: number;
  arousal: number;
  moodLabel: string;
  tags: string[];
  negativeTags: string[];
  prompt: string;
};

const HALF = 5;

const REGIONS: {
  id: string;
  anchorKey: QuadrantKey;
  xi0: number;
  xi1: number;
  yi0: number;
  yi1: number;
}[] = [
  { id: "lowValence_lowArousal", anchorKey: "lowValenceLowArousal", xi0: 0, xi1: 4, yi0: 0, yi1: 4 },
  { id: "highValence_lowArousal", anchorKey: "highValenceLowArousal", xi0: 5, xi1: 9, yi0: 0, yi1: 4 },
  { id: "lowValence_highArousal", anchorKey: "lowValenceHighArousal", xi0: 0, xi1: 4, yi0: 5, yi1: 9 },
  { id: "highValence_highArousal", anchorKey: "highValenceHighArousal", xi0: 5, xi1: 9, yi0: 5, yi1: 9 },
];

function cellsForRegion(xi0: number, xi1: number, yi0: number, yi1: number): { valence: number; arousal: number }[] {
  const out: { valence: number; arousal: number }[] = [];
  for (let yi = yi0; yi <= yi1; yi += 1) {
    for (let xi = xi0; xi <= xi1; xi += 1) {
      out.push({ valence: VA_GRID_VALUES[xi], arousal: VA_GRID_VALUES[yi] });
    }
  }
  return out;
}

function extractJsonFromAssistantText(text: string): unknown {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/im.exec(trimmed);
  const candidate = fence ? fence[1].trim() : trimmed;
  return JSON.parse(candidate);
}

function quarterSystemPrompt() {
  return `You are filling part of a 10×10 Valence–Arousal (VA) mood map for music visualization and image generation.

You will receive:
- English "corner anchors" for all four VA corners (from sample-listening notes).
- A fixed list of exactly 25 (valence, arousal) pairs — you MUST output one grid point per pair, using those EXACT numbers (3 decimal places as given).
- overall visualStyle / title context.

For EVERY one of the 25 cells you MUST write:
- moodLabel: short English
- tags: 4–8 English SD-style keywords (unique per cell where possible)
- negativeTags: 3–8 English terms
- prompt: ONE concise English image prompt line for THIS cell only. **Each cell needs its own wording** — do not duplicate the same sentence across cells. Neighboring cells in valence/arousal space should feel like small steps (similar but not identical).

Output a single JSON object: { "points": [ ... ] } with exactly 25 items. No markdown. All strings English.`;
}

const validVa = new Set(VA_GRID_VALUES.map((v) => Number(v.toFixed(3))));

function mapOneRawPoint(p: RawGridPoint, idSuffix: string): PromptPoint {
  const valence = Number(Number(p.valence).toFixed(3));
  const arousal = Number(Number(p.arousal).toFixed(3));
  if (!validVa.has(valence) || !validVa.has(arousal)) {
    throw new Error(`Invalid VA grid value for ${idSuffix}`);
  }
  return {
    id: `llm-v${valence}-a${arousal}-${idSuffix}`,
    promptListId: "",
    valence,
    arousal,
    moodLabel: String(p.moodLabel ?? ""),
    tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
    negativeTags: Array.isArray(p.negativeTags) ? p.negativeTags.map(String) : [],
    prompt: String(p.prompt ?? ""),
  };
}

/** If the model drops a cell or duplicates keys, fill gaps from bilinear fallback (same VA coords). */
function mergeQuarterWithFallback(
  rawPoints: RawGridPoint[],
  cells: { valence: number; arousal: number }[],
  cornerSeeds: Record<QuadrantKey, CornerSeed>,
  input: PromptGenerationRequest,
  regionId: string,
): PromptPoint[] {
  const fallbackByKey = new Map(
    expandGridFromCornerSeeds(cornerSeeds, input.visualStyle || "cinematic").map((p) => [
      `${p.valence.toFixed(3)},${p.arousal.toFixed(3)}`,
      p,
    ]),
  );

  const byKey = new Map<string, RawGridPoint>();
  for (const p of rawPoints) {
    const v = Number(Number(p.valence).toFixed(3));
    const a = Number(Number(p.arousal).toFixed(3));
    if (!validVa.has(v) || !validVa.has(a)) continue;
    const k = `${v.toFixed(3)},${a.toFixed(3)}`;
    if (!byKey.has(k)) byKey.set(k, { ...p, valence: v, arousal: a });
  }

  const out: PromptPoint[] = [];
  for (let i = 0; i < cells.length; i += 1) {
    const c = cells[i];
    const k = `${c.valence.toFixed(3)},${c.arousal.toFixed(3)}`;
    const raw = byKey.get(k);
    if (raw) {
      out.push(mapOneRawPoint(raw, `${regionId}-${i}`));
    } else {
      const fb = fallbackByKey.get(k);
      if (!fb) throw new Error(`No fallback for quarter cell ${regionId} ${k}`);
      out.push({
        ...fb,
        id: `pad-${regionId}-${k}`,
        moodLabel: fb.moodLabel.includes("interpolated") ? fb.moodLabel : `${fb.moodLabel} (gap-fill)`,
      });
    }
  }
  return out;
}

async function generateQuarter(
  client: OpenAI,
  model: string,
  region: (typeof REGIONS)[number],
  cornerSeeds: Record<QuadrantKey, CornerSeed>,
  input: PromptGenerationRequest,
): Promise<PromptPoint[]> {
  const cells = cellsForRegion(region.xi0, region.xi1, region.yi0, region.yi1);
  if (cells.length !== HALF * HALF) {
    throw new Error(`Region ${region.id} expected ${HALF * HALF} cells`);
  }

  const anchors = Object.fromEntries(
    QUADRANT_KEYS.map((k) => [k, cornerSeeds[k]] as const),
  ) as Record<QuadrantKey, CornerSeed>;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.55,
    max_tokens: 5500,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: quarterSystemPrompt() },
      {
        role: "user",
        content: JSON.stringify({
          regionId: region.id,
          primaryAnchor: region.anchorKey,
          note: "This block sits toward the VA corner described by primaryAnchor. Inner edges should gently anticipate neighboring quadrants using the full anchors object.",
          visualStyle: input.visualStyle,
          title: input.title,
          description: input.description,
          cornerAnchorsEnglish: anchors,
          cells,
          requiredPointCount: cells.length,
        }),
      },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error(`Empty quarter response: ${region.id}`);
  const parsed = extractJsonFromAssistantText(text) as { points?: RawGridPoint[] };
  const pts = Array.isArray(parsed.points) ? parsed.points : [];
  if (pts.length !== cells.length) {
    console.warn(`Quarter ${region.id}: model returned ${pts.length}/${cells.length} points; filling gaps from interpolation.`);
  }
  return mergeQuarterWithFallback(pts, cells, cornerSeeds, input, region.id);
}

/** LLM generates all 100 prompts (4×25 parallel). */
export async function generateHundredPointsWithLlm(
  client: OpenAI,
  model: string,
  cornerSeeds: Record<QuadrantKey, CornerSeed>,
  input: PromptGenerationRequest,
): Promise<PromptPoint[]> {
  const quarters = await Promise.all(
    REGIONS.map((region) => generateQuarter(client, model, region, cornerSeeds, input)),
  );
  const merged = quarters.flat();
  if (merged.length !== VA_EXPECTED_POINT_COUNT) {
    throw new Error(`Expected ${VA_EXPECTED_POINT_COUNT} points, got ${merged.length}`);
  }
  const seen = new Set<string>();
  for (const p of merged) {
    const k = `${p.valence.toFixed(3)},${p.arousal.toFixed(3)}`;
    if (seen.has(k)) throw new Error(`Duplicate VA cell ${k}`);
    seen.add(k);
  }
  if (seen.size !== VA_EXPECTED_POINT_COUNT) throw new Error("Incomplete VA coverage");
  return merged;
}
