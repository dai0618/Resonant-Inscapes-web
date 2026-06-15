/** FNV-1a style 32-bit hash for stable seeds from strings. */
export function stableHash(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function combineSeed(parts: Array<string | number>): number {
  return stableHash(parts.map(String).join("|"));
}

/** Deterministic PRNG in [0, 1). Same seed → same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cellRng(
  input: { title: string; description: string; visualStyle: string },
  xi: number,
  yi: number,
  valence: number,
  arousal: number,
  salt: string,
): () => number {
  const seed = combineSeed([
    input.title,
    input.description,
    input.visualStyle,
    xi,
    yi,
    valence.toFixed(3),
    arousal.toFixed(3),
    salt,
  ]);
  return mulberry32(seed);
}
