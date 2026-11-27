// random.js — a tiny seeded random number generator (mulberry32).
// The game is deterministic: no unseeded randomness or wall-clock time
// anywhere in the entry. Same seed, same farm, same escape.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick one item from a list, using the seeded rng.
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

// A number between min and max, using the seeded rng.
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

// Deterministic hash of a short string, for turning a seed word into a number.
export function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
