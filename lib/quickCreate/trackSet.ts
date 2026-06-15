export type QuickCreateTrack = {
  id: string;
  label: string;
  valence: number;
  arousal: number;
  audioPath: string;
};

export const QUICK_CREATE_TRACKS: QuickCreateTrack[] = [
  {
    id: "joyful_energetic",
    label: "Joyful / Energetic",
    valence: 0.85,
    arousal: 0.85,
    audioPath: "/audio/samples/Electronic.wav",
  },
  {
    id: "peaceful_warm",
    label: "Peaceful / Warm",
    valence: 0.85,
    arousal: 0.15,
    audioPath: "/audio/samples/Ambient.wav",
  },
  {
    id: "tense_intense",
    label: "Tense / Intense",
    valence: 0.15,
    arousal: 0.85,
    audioPath: "/audio/samples/Metal.wav",
  },
  {
    id: "lonely_quiet",
    label: "Lonely / Quiet",
    valence: 0.15,
    arousal: 0.15,
    audioPath: "/audio/samples/piano.wav",
  },
];

/** Cards shown per track during swipe session. */
export const CARDS_PER_TRACK = 10;
