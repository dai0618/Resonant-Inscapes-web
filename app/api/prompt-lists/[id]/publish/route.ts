import { NextResponse } from "next/server";
import { publishPromptList } from "@/lib/promptLists";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim();
}

export async function POST(request: Request, { params }: RouteProps) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const published = await publishPromptList(id, userData.user.id);
    if (!published) {
      return NextResponse.json({ error: "Draft not found or already published." }, { status: 404 });
    }
    return NextResponse.json({ id, visibility: "public" });
  } catch (error) {
    console.error("publish prompt list failed:", error);
    return NextResponse.json({ error: "Failed to publish draft" }, { status: 500 });
  }
}
