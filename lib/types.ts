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
