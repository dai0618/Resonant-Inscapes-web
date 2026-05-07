import { expandGridFromCornerSeeds, localCornerSeedsFromQuadrants } from "@/lib/cornerExpansion";
import { PromptGenerationRequest, PromptPoint } from "@/lib/types";

/** Mock / offline: local seeds + bilinear expansion to 100 points (fast). */
export function generateMockGridPoints(input: PromptGenerationRequest): PromptPoint[] {
  const seeds = localCornerSeedsFromQuadrants(input);
  return expandGridFromCornerSeeds(seeds, input.visualStyle || "cinematic");
}
