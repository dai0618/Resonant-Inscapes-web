import { NextResponse } from "next/server";
import { createPromptList } from "@/lib/promptLists";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = await createPromptList(body);
    return NextResponse.json({ id });
  } catch (error) {
    console.error("create prompt list failed:", error);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}
