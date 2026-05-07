import { NextResponse } from "next/server";
import { VA_EXPECTED_POINT_COUNT, VA_GRID_SIZE } from "@/lib/constants";
import { getMockPromptListById } from "@/lib/mock-data";
import { getPromptListById, incrementDownloadCount } from "@/lib/promptLists";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  const { id } = await params;
  const list = (await getPromptListById(id)) ?? getMockPromptListById(id);
  if (!list) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payload =
    list.fullJson && typeof list.fullJson === "object"
      ? { ...(list.fullJson as Record<string, unknown>), gridSize: VA_GRID_SIZE }
      : {
          id: list.id,
          title: list.title,
          description: list.description,
          targetModel: list.targetModel,
          gridSize: VA_GRID_SIZE,
          template: list.template,
          points: list.points.map((point) => ({
            valence: point.valence,
            arousal: point.arousal,
            moodLabel: point.moodLabel,
            tags: point.tags,
            negativeTags: point.negativeTags,
            prompt: point.prompt,
          })),
        };

  if (!Array.isArray((payload as { points?: unknown[] }).points) || ((payload as { points: unknown[] }).points.length !== VA_EXPECTED_POINT_COUNT)) {
    console.error(`Download payload points mismatch for ${id}`);
  }

  await incrementDownloadCount(id);
  return NextResponse.json(payload);
}
