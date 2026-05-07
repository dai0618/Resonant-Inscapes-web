import { NextResponse } from "next/server";
import OpenAI from "openai";
import { QUADRANT_KEYS, CornerSeed, expandGridFromCornerSeeds, localCornerSeedsFromQuadrants } from "@/lib/cornerExpansion";
import { VA_GRID_SIZE } from "@/lib/constants";
import { generateMockGridPoints } from "@/lib/generation";
import { generateHundredPointsWithLlm } from "@/lib/llmHundredPoints";
import { PromptGenerationRequest, QuadrantKey } from "@/lib/types";

const defaultTemplate = "music-visual-v1";

const CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function extractJsonFromAssistantText(text: string): unknown {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/im.exec(trimmed);
  const candidate = fence ? fence[1].trim() : trimmed;
  return JSON.parse(candidate);
}

function buildCornerOnlySystemPrompt() {
  return `You help build a Valence–Arousal (VA) mood map for music-driven image prompts.

Conceptual anchors (centered VA, before mapping to the app grid):
- Pleasant / high energy ≈ (+0.5, +0.5) → corner key highValenceHighArousal (joyful / energetic sample).
- Pleasant / low energy ≈ (+0.5, -0.5) → highValenceLowArousal (peaceful / warm).
- Unpleasant / high energy ≈ (-0.5, +0.5) → lowValenceHighArousal (tense / intense).
- Unpleasant / low energy ≈ (-0.5, -0.5) → lowValenceLowArousal (lonely / quiet).

The app maps these to a [0,1]×[0,1] grid. You output ONLY the four corner "cores" in this response; a separate step will ask the model to write all 100 cell prompts using these anchors.

Rules:
- User text may be Japanese, English, or mixed. You MUST output only English in tags, corePrompt, and negativeTags.
- tags: 5–8 short Stable-Diffusion-style English keywords per corner.
- corePrompt: ONE tight English line per corner (not a chatty paragraph). Reflect listening notes + color + lighting + place + texture.
- negativeTags: 3–8 English terms per corner; include "avoid" ideas and contradictory styles where relevant.

Return a single JSON object (no markdown). Shape:
{
  "title": string,
  "description": string,
  "targetModel": string,
  "template": string,
  "corners": {
    "highValenceHighArousal": { "tags": string[], "corePrompt": string, "negativeTags": string[] },
    "highValenceLowArousal": { "tags": string[], "corePrompt": string, "negativeTags": string[] },
    "lowValenceHighArousal": { "tags": string[], "corePrompt": string, "negativeTags": string[] },
    "lowValenceLowArousal": { "tags": string[], "corePrompt": string, "negativeTags": string[] }
  }
}`;
}

function mergeCornerSeeds(
  llm: Partial<Record<QuadrantKey, Partial<CornerSeed>>> | undefined,
  local: Record<QuadrantKey, CornerSeed>,
): Record<QuadrantKey, CornerSeed> {
  const out = {} as Record<QuadrantKey, CornerSeed>;
  for (const k of QUADRANT_KEYS) {
    const L = local[k];
    const remote = llm?.[k];
    out[k] = {
      tags: remote?.tags?.length ? remote.tags.map((t) => String(t).toLowerCase().trim()) : L.tags,
      corePrompt: remote?.corePrompt?.trim() ? String(remote.corePrompt).trim() : L.corePrompt,
      negativeTags: remote?.negativeTags?.length
        ? remote.negativeTags.map((t) => String(t).toLowerCase().trim())
        : L.negativeTags,
    };
  }
  return out;
}

export async function POST(request: Request) {
  let body: PromptGenerationRequest | null = null;
  try {
    body = (await request.json()) as PromptGenerationRequest;
    const normalizedInput: PromptGenerationRequest = { ...body, gridSize: body.gridSize || VA_GRID_SIZE };

    const localSeeds = localCornerSeedsFromQuadrants(normalizedInput);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const points = expandGridFromCornerSeeds(localSeeds, normalizedInput.visualStyle || "cinematic");
      return NextResponse.json({
        fallback: true,
        message: "OpenAI generation failed. Using mock data.",
        data: {
          title: body.title,
          description: body.description,
          targetModel: body.targetModel,
          template: body.visualStyle || defaultTemplate,
          gridSize: VA_GRID_SIZE,
          points,
        },
      });
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.35,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildCornerOnlySystemPrompt() },
        {
          role: "user",
          content: JSON.stringify({
            instruction: "Produce the corners JSON. All corner content must be English.",
            input: normalizedInput,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Empty completion from OpenAI");
    }

    const parsed = extractJsonFromAssistantText(raw) as {
      corners?: Partial<Record<QuadrantKey, Partial<CornerSeed>>>;
      title?: string;
      description?: string;
      targetModel?: string;
      template?: string;
    };

    const merged = mergeCornerSeeds(parsed?.corners, localSeeds);

    let points;
    let generationMode: "llm-100" | "interpolate" = "llm-100";
    try {
      points = await generateHundredPointsWithLlm(client, CHAT_MODEL, merged, normalizedInput);
    } catch (hundredError) {
      console.error("100-point LLM generation failed, using bilinear interpolation:", hundredError);
      points = expandGridFromCornerSeeds(merged, normalizedInput.visualStyle || "cinematic");
      generationMode = "interpolate";
    }

    const data = {
      title: parsed.title ?? body.title,
      description: parsed.description ?? body.description,
      targetModel: parsed.targetModel ?? body.targetModel,
      gridSize: VA_GRID_SIZE,
      template: parsed.template ?? body.visualStyle ?? defaultTemplate,
      points,
    };

    return NextResponse.json({
      fallback: false,
      data,
      model: CHAT_MODEL,
      mode: "corners+100cells",
      generationMode,
    });
  } catch (error) {
    console.error("generate-prompt-list failed:", error);
    const quadrantFallback = body?.quadrants;
    const fallbackInput: PromptGenerationRequest = {
      title: "Generated Prompt List",
      description: "Fallback output",
      targetModel: "stable-diffusion-xl",
      visualStyle: "cinematic",
      gridSize: VA_GRID_SIZE,
      quadrants: {
        highValenceHighArousal: { label: "Joyful / Energetic", userInput: "", color: "", lighting: "", place: "", texture: "", avoid: "" },
        highValenceLowArousal: { label: "Peaceful / Warm", userInput: "", color: "", lighting: "", place: "", texture: "", avoid: "" },
        lowValenceHighArousal: { label: "Tense / Intense", userInput: "", color: "", lighting: "", place: "", texture: "", avoid: "" },
        lowValenceLowArousal: { label: "Lonely / Quiet", userInput: "", color: "", lighting: "", place: "", texture: "", avoid: "" },
      },
    };
    return NextResponse.json({
      fallback: true,
      message: "OpenAI generation failed. Using mock data.",
      data: {
        title: fallbackInput.title,
        description: fallbackInput.description,
        targetModel: fallbackInput.targetModel,
        gridSize: VA_GRID_SIZE,
        template: fallbackInput.visualStyle,
        points: generateMockGridPoints({ ...fallbackInput, quadrants: quadrantFallback ?? fallbackInput.quadrants }),
      },
    });
  }
}
