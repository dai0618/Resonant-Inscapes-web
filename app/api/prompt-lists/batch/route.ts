import { NextResponse } from "next/server";
import { getPromptListsByIds } from "@/lib/promptLists";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ids = body?.ids;
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "ids must be an array" }, { status: 400 });
    }
    const lists = await getPromptListsByIds(ids);
    return NextResponse.json({ lists });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
