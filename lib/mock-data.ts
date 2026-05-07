import { VA_GRID_SIZE } from "@/lib/constants";
import { generateMockGridPoints } from "@/lib/generation";
import { PromptList, PromptPoint, PromptGenerationRequest } from "@/lib/types";

function makePoint(
  id: string,
  promptListId: string,
  valence: number,
  arousal: number,
  moodLabel: string,
  tags: string[],
  prompt: string,
  negativeTags: string[],
): PromptPoint {
  return {
    id,
    promptListId,
    valence,
    arousal,
    moodLabel,
    tags,
    prompt,
    negativeTags,
  };
}

const makeBasePoints = (promptListId: string): PromptPoint[] => {
  const request: PromptGenerationRequest = {
    title: "Mock",
    description: "Mock",
    targetModel: "stable-diffusion-xl",
    visualStyle: "cinematic",
    gridSize: VA_GRID_SIZE,
    quadrants: {
      highValenceHighArousal: { label: "Joyful / Energetic", userInput: "uplifting rhythm", color: "vivid neon", lighting: "dynamic stage light", place: "city at night", texture: "clean gloss", avoid: "blurry, muddy colors" },
      highValenceLowArousal: { label: "Peaceful / Warm", userInput: "soft acoustic warmth", color: "warm amber", lighting: "sunset diffuse light", place: "quiet meadow", texture: "soft grain", avoid: "harsh shadows, clutter" },
      lowValenceHighArousal: { label: "Tense / Intense", userInput: "industrial tension", color: "deep red and charcoal", lighting: "strobe contrast", place: "abstract concrete space", texture: "gritty surface", avoid: "pastel, cute style" },
      lowValenceLowArousal: { label: "Lonely / Quiet", userInput: "distant melancholic piano", color: "cold blue-gray", lighting: "dim ambient light", place: "empty street", texture: "mist and film grain", avoid: "bright festival, crowded" },
    },
  };
  return generateMockGridPoints(request).map((point) =>
    makePoint(
      `${promptListId}-${point.id}`,
      promptListId,
      point.valence,
      point.arousal,
      point.moodLabel,
      point.tags,
      point.prompt,
      point.negativeTags,
    ),
  );
};

export const promptLists: PromptList[] = [
  {
    id: "aurora-pulse",
    title: "Aurora Pulse Set",
    description: "Electronic-pop向け。鮮やかな高揚感と静かな余韻を往復する映像タグセット。",
    authorId: "00000000-0000-0000-0000-000000000001",
    authorName: "Mina S",
    authorHandle: "mina",
    thumbnailUrl: null,
    targetModel: "stable-diffusion-xl",
    template: "music-visual-v1",
    visibility: "public",
    likeCount: 486,
    downloadCount: 1420,
    forkedFromId: null,
    fullJson: null,
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01",
    points: makeBasePoints("aurora-pulse"),
  },
  {
    id: "midnight-choir",
    title: "Midnight Choir",
    description: "アンビエント〜ポストロック向け。静寂と緊張のグラデーションを作るPrompt List。",
    authorId: "00000000-0000-0000-0000-000000000002",
    authorName: "RI Studio",
    authorHandle: "ri-studio",
    thumbnailUrl: null,
    targetModel: "stable-diffusion-xl",
    template: "ambient-v2",
    visibility: "public",
    likeCount: 201,
    downloadCount: 640,
    forkedFromId: null,
    fullJson: null,
    createdAt: "2026-05-05",
    updatedAt: "2026-05-05",
    points: makeBasePoints("midnight-choir"),
  },
  {
    id: "urban-kintsugi",
    title: "Urban Kintsugi",
    description: "ローファイ/ヒップホップ向け。質感重視で都市夜景と孤独感を表現。",
    authorId: "00000000-0000-0000-0000-000000000003",
    authorName: "T. Kato",
    authorHandle: "tkato",
    thumbnailUrl: null,
    targetModel: "stable-diffusion-xl",
    template: "lofi-v1",
    visibility: "public",
    likeCount: 330,
    downloadCount: 930,
    forkedFromId: null,
    fullJson: null,
    createdAt: "2026-04-28",
    updatedAt: "2026-04-28",
    points: makeBasePoints("urban-kintsugi"),
  },
];

export function getMockPromptListById(id: string) {
  return promptLists.find((list) => list.id === id);
}

export function buildFallbackFromGeneration(
  request: PromptGenerationRequest,
  points: PromptPoint[],
): PromptList {
  const now = new Date().toISOString();
  return {
    id: `generated-${Date.now()}`,
    title: request.title || "Untitled Prompt List",
    description: request.description || "Generated from Create Wizard",
    authorId: "00000000-0000-0000-0000-000000000000",
    authorName: "Local User",
    authorHandle: "local-user",
    thumbnailUrl: null,
    targetModel: request.targetModel || "stable-diffusion-xl",
    template: request.visualStyle || "default",
    visibility: "draft",
    likeCount: 0,
    downloadCount: 0,
    forkedFromId: null,
    fullJson: {
      title: request.title,
      description: request.description,
      targetModel: request.targetModel,
      template: request.visualStyle,
      points,
    },
    createdAt: now,
    updatedAt: now,
    points,
  };
}
