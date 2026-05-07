import { notFound } from "next/navigation";
import PromptListDetailView from "@/components/PromptListDetailView";
import { getMockPromptListById } from "@/lib/mock-data";
import { getPromptListById } from "@/lib/promptLists";

type PromptListDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PromptListDetailPage({ params }: PromptListDetailPageProps) {
  const { id } = await params;
  let list = null;
  try {
    list = await getPromptListById(id);
  } catch (error) {
    console.error("Failed to fetch list detail from Supabase:", error);
  }
  if (!list) {
    list = getMockPromptListById(id) ?? null;
  }

  if (!list) {
    notFound();
  }

  return <PromptListDetailView list={list} />;
}
