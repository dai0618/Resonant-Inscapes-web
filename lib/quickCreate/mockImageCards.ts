import { ImageCard } from "@/lib/types";

const SCENE_FAMILIES = [
  "neon city street at night",
  "misty forest path",
  "sunlit meadow",
  "rainy urban alley",
  "coastal cliff at dusk",
  "cozy interior with warm lamps",
  "abandoned warehouse",
  "snow-covered park",
  "desert highway",
  "underwater caustics",
  "rooftop skyline view",
  "subway platform",
  "cherry blossom avenue",
  "industrial factory floor",
  "candlelit cathedral",
  "foggy lake shore",
  "tropical beach sunset",
  "cyberpunk market",
  "mountain cabin interior",
  "stormy ocean horizon",
  "autumn forest canopy",
  "minimal white gallery",
  "vintage diner booth",
  "nightclub dance floor",
  "quiet library stacks",
  "flower field breeze",
  "thunderstorm cityscape",
  "moonlit desert dunes",
  "bamboo grove",
  "glass skyscraper lobby",
];

const MOOD_TAGS: Record<string, string[]> = {
  joyful: ["vibrant", "uplifting", "dynamic", "celebratory", "radiant"],
  peaceful: ["serene", "soft", "gentle", "calm", "warm"],
  tense: ["dramatic", "sharp", "urgent", "gritty", "intense"],
  lonely: ["melancholic", "quiet", "sparse", "muted", "introspective"],
};

const LIGHTING = [
  "golden hour glow",
  "neon rim light",
  "soft diffused skylight",
  "harsh overhead fluorescents",
  "candle warmth",
  "moonlight silver",
  "backlit silhouette",
  "volumetric fog rays",
];

const TEXTURES = [
  "film grain",
  "wet asphalt reflections",
  "soft bokeh",
  "crisp digital clarity",
  "matte pastel surfaces",
  "gritty concrete",
  "velvet shadows",
  "glass reflections",
];

const NEGATIVE_POOL = [
  "blurry",
  "low quality",
  "text watermark",
  "oversaturated",
  "cartoon",
  "anime",
  "deformed",
  "cluttered composition",
  "harsh flash",
  "flat lighting",
];

function moodForVa(v: number, a: number): string {
  if (v >= 0.5 && a >= 0.5) return "Joyful / Energetic";
  if (v >= 0.5 && a < 0.5) return "Peaceful / Warm";
  if (v < 0.5 && a >= 0.5) return "Tense / Intense";
  return "Lonely / Quiet";
}

function moodKey(v: number, a: number): keyof typeof MOOD_TAGS {
  if (v >= 0.5 && a >= 0.5) return "joyful";
  if (v >= 0.5 && a < 0.5) return "peaceful";
  if (v < 0.5 && a >= 0.5) return "tense";
  return "lonely";
}

function buildMockCard(index: number): ImageCard {
  const gridSize = 12;
  const xi = index % gridSize;
  const yi = Math.floor(index / gridSize);
  const valence = Number((xi / (gridSize - 1)).toFixed(3));
  const arousal = Number((yi / (gridSize - 1)).toFixed(3));
  const sceneFamily = SCENE_FAMILIES[index % SCENE_FAMILIES.length]!;
  const mk = moodKey(valence, arousal);
  const baseTags = MOOD_TAGS[mk];
  const lighting = LIGHTING[index % LIGHTING.length]!;
  const texture = TEXTURES[index % TEXTURES.length]!;
  const tags = [...baseTags.slice(0, 3), lighting.split(" ")[0]!, texture.split(" ")[0]!];
  const negativeTags = [
    NEGATIVE_POOL[index % NEGATIVE_POOL.length]!,
    NEGATIVE_POOL[(index + 3) % NEGATIVE_POOL.length]!,
    NEGATIVE_POOL[(index + 5) % NEGATIVE_POOL.length]!,
  ];
  const moodLabel = moodForVa(valence, arousal);
  const placeholderNum = (index % 24) + 1;

  return {
    id: `mock-card-${index}`,
    valence,
    arousal,
    moodLabel,
    sceneFamily,
    tags,
    negativeTags,
    prompt: `${sceneFamily}, ${moodLabel.toLowerCase()}, ${lighting}, ${texture}, cinematic composition, high detail`,
    imagePath: `/images/placeholders/placeholder-${placeholderNum}.jpg`,
    seed: 1000 + index,
    model: "stable-diffusion-xl",
  };
}

/** 144 mock cards spread across the VA grid (swap-ready via loadImageCards). */
export const MOCK_IMAGE_CARDS: ImageCard[] = Array.from({ length: 144 }, (_, i) => buildMockCard(i));
