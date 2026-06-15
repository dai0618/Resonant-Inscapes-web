export const VA_GRID_SIZE = 10;

export const VA_GRID_VALUES = Array.from({ length: VA_GRID_SIZE }, (_, i) =>
  Number((i / (VA_GRID_SIZE - 1)).toFixed(3)),
);

export const VA_EXPECTED_POINT_COUNT = VA_GRID_SIZE * VA_GRID_SIZE;

/** Generated swipe / prompt images are 512×512 px. */
export const IMAGE_CARD_SIZE = 512;
