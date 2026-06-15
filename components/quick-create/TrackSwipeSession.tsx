"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AudioTransportButton from "@/components/quick-create/AudioTransportButton";
import SwipeCard from "@/components/quick-create/SwipeCard";
import SwipeProgress from "@/components/quick-create/SwipeProgress";
import { loadImageCards, selectCardsForTrack } from "@/lib/quickCreate/imageCards";
import { CARDS_PER_TRACK, QUICK_CREATE_TRACKS } from "@/lib/quickCreate/trackSet";
import { ImageCard, SwipeResponse } from "@/lib/types";

type TrackSwipeSessionProps = {
  onComplete: (responses: SwipeResponse[]) => void;
};

export default function TrackSwipeSession({ onComplete }: TrackSwipeSessionProps) {
  const [allCards, setAllCards] = useState<ImageCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [responses, setResponses] = useState<SwipeResponse[]>([]);
  const [animating, setAnimating] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const trackCardsPerTrack = useMemo(() => {
    if (allCards.length === 0) return [];
    return QUICK_CREATE_TRACKS.map((track, ti) =>
      selectCardsForTrack(allCards, track.valence, track.arousal, CARDS_PER_TRACK, ti),
    );
  }, [allCards]);

  const currentTrack = QUICK_CREATE_TRACKS[trackIndex];
  const currentCards = trackCardsPerTrack[trackIndex] ?? [];
  const currentCard = currentCards[cardIndex];

  const startPlayback = useCallback((audio: HTMLAudioElement, trackId: string) => {
    void audio.play().then(() => setPlayingTrackId(trackId)).catch(() => setPlayingTrackId(null));
  }, []);

  useEffect(() => {
    loadImageCards().then((cards) => {
      setAllCards(cards);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!currentTrack) return;
    const audio = new Audio(currentTrack.audioPath);
    audio.loop = true;
    audioRef.current = audio;
    startPlayback(audio, currentTrack.id);
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [currentTrack, startPlayback]);

  const playing = playingTrackId === currentTrack?.id;

  const toggleAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (playing) {
      audio.pause();
      setPlayingTrackId(null);
    } else {
      startPlayback(audio, currentTrack.id);
    }
  }, [currentTrack, playing, startPlayback]);

  const recordSwipe = useCallback(
    (liked: boolean) => {
      if (!currentCard || !currentTrack || animating) return;
      setAnimating(true);

      const response: SwipeResponse = {
        id: crypto.randomUUID(),
        cardId: currentCard.id,
        trackId: currentTrack.id,
        valence: currentCard.valence,
        arousal: currentCard.arousal,
        sceneFamily: currentCard.sceneFamily,
        tags: currentCard.tags,
        negativeTags: currentCard.negativeTags,
        liked,
        timestamp: Date.now(),
      };

      const nextResponses = [...responses, response];
      setResponses(nextResponses);

      window.setTimeout(() => {
        const nextCardIndex = cardIndex + 1;
        if (nextCardIndex < currentCards.length) {
          setCardIndex(nextCardIndex);
          setAnimating(false);
          return;
        }

        const nextTrackIndex = trackIndex + 1;
        if (nextTrackIndex < QUICK_CREATE_TRACKS.length) {
          setTrackIndex(nextTrackIndex);
          setCardIndex(0);
          setAnimating(false);
          return;
        }

        onComplete(nextResponses);
      }, 180);
    },
    [animating, cardIndex, currentCard, currentCards.length, currentTrack, onComplete, responses, trackIndex],
  );

  const handleResonates = useCallback(() => recordSwipe(true), [recordSwipe]);
  const handleNotClose = useCallback(() => recordSwipe(false), [recordSwipe]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleNotClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleResonates();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNotClose, handleResonates]);

  if (loading) {
    return <p className="py-20 text-center text-sm text-[var(--ri-muted)]">Loading…</p>;
  }

  if (!currentTrack || !currentCard) {
    return <p className="py-20 text-center text-sm text-[var(--ri-muted)]">No cards</p>;
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-1 flex-col">
      <div className="flex items-start justify-between gap-6 py-4">
        <SwipeProgress
          trackIndex={trackIndex}
          trackCount={QUICK_CREATE_TRACKS.length}
          cardIndex={cardIndex}
          cardCount={currentCards.length}
        />
        <AudioTransportButton playing={playing} onToggle={toggleAudio} />
      </div>

      <SwipeCard
        key={`${currentTrack.id}-${currentCard.id}`}
        card={currentCard}
        onResonates={handleResonates}
        onNotClose={handleNotClose}
        disabled={animating}
      />
    </div>
  );
}
