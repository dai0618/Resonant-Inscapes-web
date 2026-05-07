import { getMockPromptListById, promptLists as mockPromptLists } from "@/lib/mock-data";
import { VA_EXPECTED_POINT_COUNT, VA_GRID_SIZE } from "@/lib/constants";
import { PromptList, PromptPoint } from "@/lib/types";
import { getSupabaseForMutation, getSupabaseServerClient } from "@/lib/supabase/server";

type PromptListCreateInput = {
  title: string;
  description: string;
  authorId: string;
  authorName?: string;
  authorHandle?: string;
  thumbnailUrl?: string | null;
  targetModel: string;
  template: string;
  visibility: "public" | "private" | "draft";
  forkedFromId?: string | null;
  fullJson?: unknown;
  points: Array<{
    valence: number;
    arousal: number;
    moodLabel: string;
    tags: string[];
    negativeTags: string[];
    prompt: string;
  }>;
};

type PromptListRow = {
  id: string;
  title: string;
  description: string | null;
  author_id: string | null;
  thumbnail_url: string | null;
  target_model: string | null;
  template: string | null;
  visibility: string | null;
  like_count: number | null;
  download_count: number | null;
  forked_from_id: string | null;
  full_json: unknown;
  created_at: string;
  updated_at: string | null;
  profiles?: { name: string | null; handle: string | null } | null;
  prompt_points?: PromptPointRow[] | null;
};

type PromptPointRow = {
  id: string;
  prompt_list_id: string;
  valence: number | string;
  arousal: number | string;
  mood_label: string | null;
  tags: unknown;
  negative_tags: unknown;
  prompt: string | null;
};

function mapPromptListRow(row: PromptListRow, points: PromptPoint[] = []): PromptList {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    authorId: row.author_id ?? "",
    authorName: row.profiles?.name ?? "Unknown",
    authorHandle: row.profiles?.handle ?? "unknown",
    thumbnailUrl: row.thumbnail_url ?? null,
    targetModel: row.target_model ?? "stable-diffusion-xl",
    template: row.template ?? "default",
    visibility: (row.visibility ?? "draft") as PromptList["visibility"],
    likeCount: row.like_count ?? 0,
    downloadCount: row.download_count ?? 0,
    forkedFromId: row.forked_from_id ?? null,
    fullJson: row.full_json ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    points,
  };
}

function mapPointRow(row: PromptPointRow): PromptPoint {
  return {
    id: row.id,
    promptListId: row.prompt_list_id,
    valence: Number(row.valence),
    arousal: Number(row.arousal),
    moodLabel: row.mood_label ?? "Unlabeled",
    tags: Array.isArray(row.tags) ? row.tags : [],
    negativeTags: Array.isArray(row.negative_tags) ? row.negative_tags : [],
    prompt: row.prompt ?? "",
  };
}

export async function getPublicPromptLists() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return mockPromptLists;

  const { data, error } = await supabase
    .from("prompt_lists")
    .select("*, profiles!prompt_lists_author_id_fkey(name, handle)")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPublicPromptLists failed:", error);
    return mockPromptLists;
  }

  return (data ?? []).map((row) => mapPromptListRow(row));
}

const MAX_BATCH_IDS = 50;

export async function getPromptListsByIds(ids: string[]): Promise<PromptList[]> {
  const ordered = [...new Set(ids.filter((id) => typeof id === "string" && id.length > 0))].slice(0, MAX_BATCH_IDS);
  if (ordered.length === 0) return [];

  const supabase = getSupabaseForMutation() ?? getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("prompt_lists")
    .select("*, profiles!prompt_lists_author_id_fkey(name, handle)")
    .in("id", ordered);

  if (error) {
    console.error("getPromptListsByIds failed:", error);
    return [];
  }

  const byId = new Map((data ?? []).map((row: PromptListRow) => [row.id, mapPromptListRow(row)]));
  return ordered.map((id) => byId.get(id)).filter((list): list is PromptList => list !== undefined);
}

export async function getPromptListById(id: string) {
  const supabase = getSupabaseForMutation() ?? getSupabaseServerClient();
  if (!supabase) return getMockPromptListById(id) ?? null;

  const { data, error } = await supabase
    .from("prompt_lists")
    .select("*, profiles!prompt_lists_author_id_fkey(name, handle), prompt_points(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("getPromptListById failed:", error);
    return getMockPromptListById(id) ?? null;
  }

  const points = Array.isArray(data.prompt_points) ? data.prompt_points.map(mapPointRow) : [];
  return mapPromptListRow(data, points);
}

function resolveAuthorIdForInsert(authorId: string): string | null {
  if (!authorId || authorId === "00000000-0000-0000-0000-000000000000") {
    return null;
  }
  return authorId;
}

export async function createPromptList(input: PromptListCreateInput) {
  const supabase = getSupabaseForMutation();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  if (input.points.length !== VA_EXPECTED_POINT_COUNT) {
    throw new Error(`Prompt list must contain ${VA_EXPECTED_POINT_COUNT} points`);
  }

  const serializedFullJson = input.fullJson ?? {
    title: input.title,
    description: input.description,
    targetModel: input.targetModel,
    gridSize: VA_GRID_SIZE,
    template: input.template,
    points: input.points,
  };

  const { data: inserted, error } = await supabase
    .from("prompt_lists")
    .insert({
      title: input.title,
      description: input.description,
      author_id: resolveAuthorIdForInsert(input.authorId),
      thumbnail_url: input.thumbnailUrl ?? null,
      target_model: input.targetModel,
      template: input.template,
      visibility: input.visibility,
      forked_from_id: input.forkedFromId ?? null,
      full_json: serializedFullJson,
    })
    .select("*")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message ?? "Failed to create prompt list");
  }

  const pointsPayload = input.points.map((point) => ({
    prompt_list_id: inserted.id,
    valence: point.valence,
    arousal: point.arousal,
    mood_label: point.moodLabel,
    tags: point.tags,
    negative_tags: point.negativeTags,
    prompt: point.prompt,
  }));

  if (pointsPayload.length > 0) {
    const { error: pointsError } = await supabase.from("prompt_points").insert(pointsPayload);
    if (pointsError) {
      throw new Error(pointsError.message);
    }
  }

  return inserted.id as string;
}

export async function incrementDownloadCount(id: string) {
  const supabase = getSupabaseForMutation();
  if (!supabase) return;

  const { data, error } = await supabase.from("prompt_lists").select("download_count").eq("id", id).single();
  if (error || !data) {
    console.error("incrementDownloadCount select failed:", error);
    return;
  }

  const { error: updateError } = await supabase
    .from("prompt_lists")
    .update({ download_count: (data.download_count ?? 0) + 1, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    console.error("incrementDownloadCount update failed:", updateError);
  }
}

export async function publishPromptList(id: string, authorId: string): Promise<boolean> {
  const supabase = getSupabaseForMutation();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  if (!id || !authorId) {
    throw new Error("Missing publish parameters.");
  }

  const { data, error } = await supabase
    .from("prompt_lists")
    .update({ visibility: "public", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("author_id", authorId)
    .eq("visibility", "draft")
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.id);
}
