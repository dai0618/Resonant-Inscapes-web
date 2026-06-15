import { localCornerSeedsFromQuadrants } from "@/lib/cornerExpansion";
import { generateDiverseGridFromCornerSeeds } from "@/lib/diverseGridGeneration";
import { PromptGenerationRequest, PromptPoint } from "@/lib/types";

/** Mock / offline: local seeds + diverse scene distribution (deterministic). */
export function generateMockGridPoints(input: PromptGenerationRequest): PromptPoint[] {
  const seeds = localCornerSeedsFromQuadrants(input);
  return generateDiverseGridFromCornerSeeds(seeds, input);
}
