type StartStepProps = {
  onStart: () => void;
};

export default function StartStep({ onStart }: StartStepProps) {
  return (
    <div className="flex flex-1 flex-col justify-between py-12">
      <div className="space-y-10">
        <h1 className="text-2xl font-light tracking-tight text-[var(--ri-text)]">Resonant Inscapes</h1>
        <div className="space-y-4 text-base font-light leading-relaxed text-[var(--ri-muted)]">
          <p>Listen to four pieces of music.</p>
          <p>Choose the images that resonate.</p>
          <p>A prompt map will emerge.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="w-full border border-[var(--ri-accent)]/40 py-4 text-xs tracking-[0.15em] text-[var(--ri-accent)] uppercase transition hover:border-[var(--ri-accent)] hover:bg-[var(--ri-accent-dim)]"
      >
        Start
      </button>
    </div>
  );
}
