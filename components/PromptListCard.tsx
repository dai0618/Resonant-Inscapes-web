import Link from "next/link";
import { PromptList } from "@/lib/types";

type PromptListCardProps = {
  list: PromptList;
  sectionLabel?: string;
};

export default function PromptListCard({ list, sectionLabel }: PromptListCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800">{sectionLabel ?? list.visibility}</span>
        <span className="text-xs font-medium text-zinc-800">{list.createdAt}</span>
      </div>
      <h3 className="mb-1 text-lg font-semibold text-zinc-900">{list.title}</h3>
      <p className="mb-4 text-sm text-zinc-800">{list.description}</p>
      <div className="mb-4 flex gap-4 text-xs font-medium text-zinc-800">
        <span>{list.authorName}</span>
        <span>{list.downloadCount} downloads</span>
        <span>{list.likeCount} likes</span>
      </div>
      <Link
        href={`/lists/${list.id}`}
        className="inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
      >
        Open Prompt List
      </Link>
    </article>
  );
}
