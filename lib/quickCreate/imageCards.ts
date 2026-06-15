import { ImageCard } from "@/lib/types";
import { MOCK_IMAGE_CARDS } from "@/lib/quickCreate/mockImageCards";

/** Existing bundle at `/cards.json`; optional future path `/image-cards/cards.json`. */
const CARDS_JSON_PATHS = ["/cards.json", "/image-cards/cards.json"];

let cachedCards: ImageCard[] | null = null;

type RawImageCard = ImageCard & { negativePrompt?: string };

function isValidImageCard(raw: unknown): raw is RawImageCard {
  if (!raw || typeof raw !== "object") return false;
  const c = raw as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.valence === "number" &&
    typeof c.arousal === "number" &&
    typeof c.moodLabel === "string" &&
    typeof c.sceneFamily === "string" &&
    Array.isArray(c.tags) &&
    typeof c.prompt === "string" &&
    typeof c.imagePath === "string"
  );
}

function normalizeImagePath(path: string): string {
  if (path.startsWith("/")) return path;
  return `/${path}`;
}

function normalizeCard(raw: RawImageCard): ImageCard {
  let negativeTags = Array.isArray(raw.negativeTags) ? raw.negativeTags.map(String) : [];
  if (negativeTags.length === 0 && typeof raw.negativePrompt === "string" && raw.negativePrompt.trim()) {
    negativeTags = raw.negativePrompt
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return {
    id: raw.id,
    valence: raw.valence,
    arousal: raw.arousal,
    moodLabel: raw.moodLabel,
    sceneFamily: raw.sceneFamily,
    tags: raw.tags.map(String),
    negativeTags,
    prompt: raw.prompt,
    imagePath: normalizeImagePath(raw.imagePath),
    seed: raw.seed,
    model: raw.model,
  };
}

function normalizeCards(data: unknown): ImageCard[] {
  const rawList: unknown[] = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { cards?: unknown }).cards)
      ? ((data as { cards: unknown[] }).cards ?? [])
      : [];

  return rawList.filter(isValidImageCard).map(normalizeCard);
}

async function fetchCardsFromPaths(): Promise<ImageCard[]> {
  let lastError: unknown;
  for (const path of CARDS_JSON_PATHS) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`${path} ${res.status}`);
      const data = await res.json();
      const cards = normalizeCards(data);
      if (cards.length === 0) throw new Error(`empty ${path}`);
      return cards;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("no cards.json found");
}

/**
 * Load image cards from `/image-cards/cards.json` or `/cards.json`, falling back to mock data.
 * UI components should use this — never import mockImageCards directly.
 */
export async function loadImageCards(): Promise<ImageCard[]> {
  if (cachedCards) return cachedCards;

  try {
    cachedCards = await fetchCardsFromPaths();
    return cachedCards;
  } catch (error) {
    console.warn("loadImageCards: using mock fallback", error);
    cachedCards = MOCK_IMAGE_CARDS;
    return MOCK_IMAGE_CARDS;
  }
}

/** VA distance between card and track anchor. */
export function vaDistance(
  v1: number,
  a1: number,
  v2: number,
  a2: number,
): number {
  return Math.hypot(v1 - v2, a1 - a2);
}

/** Pick cards for a track: closest VA first, with light shuffle for variety. */
export function selectCardsForTrack(
  allCards: ImageCard[],
  trackValence: number,
  trackArousal: number,
  count: number,
  trackIndex: number,
): ImageCard[] {
  const ranked = [...allCards].sort((a, b) => {
    const da = vaDistance(a.valence, a.arousal, trackValence, trackArousal);
    const db = vaDistance(b.valence, b.arousal, trackValence, trackArousal);
    return da - db;
  });

  const poolSize = Math.min(ranked.length, count * 3);
  const pool = ranked.slice(0, poolSize);

  const offset = (trackIndex * 7) % Math.max(1, pool.length - count);
  const slice = pool.slice(offset, offset + count);
  if (slice.length >= count) return slice;

  const used = new Set(slice.map((c) => c.id));
  for (const card of ranked) {
    if (slice.length >= count) break;
    if (!used.has(card.id)) {
      slice.push(card);
      used.add(card.id);
    }
  }
  return slice.slice(0, count);
}
