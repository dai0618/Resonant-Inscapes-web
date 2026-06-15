import LibraryCreatedSection from "@/components/LibraryCreatedSection";
import RiPageTitle from "@/components/ui/RiPageTitle";

export default function LibraryPage() {
  return (
    <div className="flex flex-1 flex-col">
      <RiPageTitle subtitle="Prompt maps saved on this device.">Local archive</RiPageTitle>

      <section className="flex-1">
        <LibraryCreatedSection />
      </section>

      <section className="mt-16 border-t border-[var(--ri-line)] pt-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--ri-muted)]">Saved lists</p>
        <p className="mt-4 text-sm text-[var(--ri-muted)]">Coming soon.</p>
      </section>
    </div>
  );
}
