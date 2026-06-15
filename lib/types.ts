export type UserProfile = {
  id: string;
  name: string | null;
  handle: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
};

export type PromptPoint = {
  id: string;
  promptListId: string;
  valence: number;
  arousal: number;
  moodLabel: string;
  tags: string[];
  negativeTags: string[];
  prompt: string;
  /** Scene / place family used for diversity (not bilinear-blended across VA). */
  sceneFamily?: string;
};

export type PromptList = {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  thumbnailUrl: string | null;
  targetModel: string;
  template: string;
  visibility: "public" | "private" | "draft";
  likeCount: number;
  downloadCount: number;
  forkedFromId: string | null;
  fullJson: unknown;
  createdAt: string;
  updatedAt: string;
  points: PromptPoint[];
};

export type PromptListAsset = {
  id: string;
  promptListId: string;
  type: string;
  url: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type QuadrantInput = {
  label: string;
  userInput: string;
  color: string;
  lighting: string;
  place: string;
  texture: string;
  avoid: string;
};

export type PromptGenerationRequest = {
  title: string;
  description: string;
  targetModel: string;
  visualStyle: string;
  gridSize: number;
  quadrants: {
    highValenceHighArousal: QuadrantInput;
    highValenceLowArousal: QuadrantInput;
    lowValenceHighArousal: QuadrantInput;
    lowValenceLowArousal: QuadrantInput;
  };
};

export type QuadrantKey = keyof PromptGenerationRequest["quadrants"];

export type ImageCard = {
  id: string;
  valence: number;
  arousal: number;
  moodLabel: string;
  sceneFamily: string;
  tags: string[];
  negativeTags: string[];
  prompt: string;
  imagePath: string;
  seed?: number;
  model?: string;
};

export type SwipeResponse = {
  id: string;
  cardId: string;
  trackId: string;
  valence: number;
  arousal: number;
  sceneFamily: string;
  tags: string[];
  negativeTags: string[];
  liked: boolean;
  timestamp: number;
};

export type ResonantProfile = {
  preferredValence: number;
  preferredArousal: number;
  valenceSpread: number;
  arousalSpread: number;
  sceneFamilyWeights: Record<string, number>;
  tagWeights: Record<string, number>;
  negativeTagWeights: Record<string, number>;
  responseCount: number;
};

