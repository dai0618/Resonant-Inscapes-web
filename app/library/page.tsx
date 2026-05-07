import LibraryCreatedSection from "@/components/LibraryCreatedSection";

export default function LibraryPage() {
  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">My Library</h1>
        <p className="mt-2 text-sm text-zinc-800">
          このブラウザで保存した Prompt List を一覧します。アカウント連携前のため、端末ごとに記録されます。
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Created by Me</h2>
        <LibraryCreatedSection />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Saved Lists</h2>
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-8 text-center text-sm text-zinc-800">
          お気に入り・保存リストは今後のバージョンで対応予定です。
        </div>
      </section>
    </section>
  );
}
