"use client";

import { useCallback, useRef, useState } from "react";
import { ImageCard } from "@/lib/types";

type SwipeCardProps = {
  card: ImageCard;
  onResonates: () => void;
  onNotClose: () => void;
  disabled?: boolean;
};

const GRADIENTS = [
  "from-[var(--ri-bg-soft)] via-[#121a17] to-[#1a2420]",
  "from-[var(--ri-bg-soft)] via-[#141820] to-[#1c2028]",
];

function gradientForCard(card: ImageCard): string {
  const hash = card.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length]!;
}

export default function SwipeCard({ card, onResonates, onNotClose, disabled }: SwipeCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [dragX, setDragX] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    dragging.current = true;
    startX.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || disabled) return;
    setDragX(e.clientX - startX.current);
  };

  const finishDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    const threshold = 72;
    if (dragX < -threshold) onNotClose();
    else if (dragX > threshold) onResonates();
    setDragX(0);
  }, [dragX, onNotClose, onResonates]);

  const rotation = dragX * 0.035;
  const passOpacity = Math.min(1, Math.max(0, -dragX / 90));
  const resonatesOpacity = Math.min(1, Math.max(0, dragX / 90));

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative mx-auto w-full max-w-[512px] touch-none select-none">
        <div
          className="relative aspect-square w-full overflow-hidden border border-[var(--ri-line)] bg-[var(--ri-bg-soft)] transition-transform"
          style={{ transform: `translateX(${dragX}px) rotate(${rotation}deg)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          {!imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.imagePath}
              alt=""
              width={512}
              height={512}
              className="h-full w-full object-cover"
              onError={() => setImgFailed(true)}
              draggable={false}
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${gradientForCard(card)}`} />
          )}

          <div
            className="pointer-events-none absolute left-5 top-5 text-xs tracking-[0.15em] text-[var(--ri-muted)]"
            style={{ opacity: passOpacity }}
          >
            Pass
          </div>
          <div
            className="pointer-events-none absolute right-5 top-5 text-xs tracking-[0.15em] text-[var(--ri-accent)]"
            style={{ opacity: resonatesOpacity }}
          >
            Resonates
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between gap-8">
        <button
          type="button"
          disabled={disabled}
          onClick={onNotClose}
          className="flex-1 py-3 text-sm tracking-[0.1em] text-[var(--ri-muted)] transition disabled:opacity-40"
        >
          Pass
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onResonates}
          className="flex-1 py-3 text-sm tracking-[0.1em] text-[var(--ri-accent)] transition disabled:opacity-40"
        >
          Resonates
        </button>
      </div>
    </div>
  );
}
