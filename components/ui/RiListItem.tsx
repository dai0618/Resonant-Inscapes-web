import Link from "next/link";
import { PromptList } from "@/lib/types";

type RiListItemProps = {
  list: PromptList;
  meta?: string;
};

export default function RiListItem({ list, meta }: RiListItemProps) {
  return (
    <Link
      href={`/lists/${list.id}`}
      className="block border-b border-[var(--ri-line)] py-5 transition hover:opacity-80"
    >
      <p className="text-sm font-light text-[var(--ri-text)]">{list.title}</p>
      {list.description ? (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--ri-muted)]">{list.description}</p>
      ) : null}
      <p className="mt-2 text-[10px] tracking-[0.14em] text-[var(--ri-muted)]">
        {meta ?? list.authorName}
      </p>
    </Link>
  );
}
