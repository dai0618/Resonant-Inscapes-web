type SwipeProgressProps = {
  trackIndex: number;
  trackCount: number;
  cardIndex: number;
  cardCount: number;
};

export default function SwipeProgress({ trackIndex, trackCount, cardIndex, cardCount }: SwipeProgressProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs tracking-[0.08em] text-[var(--ri-muted)] tabular-nums">
      <span>
        Track {trackIndex + 1} of {trackCount}
      </span>
      <span className="text-[var(--ri-line)]" aria-hidden>
        ·
      </span>
      <span>
        Image {cardIndex + 1} of {cardCount}
      </span>
    </div>
  );
}
