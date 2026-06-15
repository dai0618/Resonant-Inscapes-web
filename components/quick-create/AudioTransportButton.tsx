type AudioTransportButtonProps = {
  playing: boolean;
  onToggle: () => void;
};

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72c0 .79.87 1.27 1.54.84l11.14-6.86c.63-.39.63-1.29 0-1.68L9.54 4.3C8.87 3.87 8 4.35 8 5.14z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  );
}

export default function AudioTransportButton({ playing, onToggle }: AudioTransportButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--ri-line)] text-[var(--ri-accent)] transition hover:border-[var(--ri-accent)]/50 hover:bg-[var(--ri-accent-dim)]"
      aria-label={playing ? "Pause music" : "Play music"}
    >
      {playing ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
}
