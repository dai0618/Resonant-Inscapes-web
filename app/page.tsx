import PromptListCard from "@/components/PromptListCard";
import DiscoverCreatedSection from "@/components/DiscoverCreatedSection";
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
    <section className="space-y-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-800">Discover</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">Prompt Lists for Music Visualization</h1>
        <p className="mt-3 max-w-3xl text-sm text-zinc-800">
          Resonant Inscapesは、Valence/Arousal座標に対応したPrompt Listを作成・共有・ダウンロードするためのプラットフォームです。
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">My Drafts</h2>
          <DiscoverCreatedSection />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Popular</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lists.map((list) => (
              <PromptListCard key={`popular-${list.id}`} list={list} sectionLabel="Popular" />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">New</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...lists].reverse().map((list) => (
              <PromptListCard key={`new-${list.id}`} list={list} sectionLabel="New" />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">By Category</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lists.map((list) => (
              <PromptListCard key={`category-${list.id}`} list={list} sectionLabel={list.template} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
