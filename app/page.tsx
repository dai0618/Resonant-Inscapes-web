import Link from "next/link";
import DiscoverCreatedSection from "@/components/DiscoverCreatedSection";
import RiListItem from "@/components/ui/RiListItem";
import RiPageTitle from "@/components/ui/RiPageTitle";
import { promptLists as mockPromptLists } from "@/lib/mock-data";
import { getPublicPromptLists } from "@/lib/promptLists";

export const dynamic = "force-dynamic";

export default async function Home() {
  let lists = mockPromptLists;
  try {
    lists = await getPublicPromptLists();
  } catch (error) {
    console.error("Failed to load public prompt lists. Using mock:", error);
  }

  return (
    <div className="flex flex-1 flex-col pb-8">
      <RiPageTitle subtitle="Listen. Choose images that resonate. A prompt map emerges.">
        Resonant Inscapes
      </RiPageTitle>

      <Link
        href="/create"
        className="mb-16 block border border-[var(--ri-accent)]/40 py-4 text-center text-xs uppercase tracking-[0.15em] text-[var(--ri-accent)] transition hover:border-[var(--ri-accent)] hover:bg-[var(--ri-accent-dim)]"
      >
        Start
      </Link>

      <section className="mb-12">
        <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-[var(--ri-muted)]">Your drafts</p>
        <DiscoverCreatedSection />
      </section>

      <section>
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[var(--ri-muted)]">Public atlases</p>
        {lists.length === 0 ? (
          <p className="py-8 text-sm text-[var(--ri-muted)]">No public atlases yet.</p>
        ) : (
          <div>
            {lists.map((list) => (
              <RiListItem key={list.id} list={list} meta={list.authorName} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
