import {Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {FPS} from '../data/lyricTiming';

/** Current time in seconds of the recording (global, not per-scene). */
export const useTime = () => useCurrentFrame() / FPS;

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

export const easeInOut = Easing.inOut(Easing.cubic);
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeSoft = Easing.bezier(0.45, 0, 0.2, 1);

/** 0→1 progress of t between a and b, clamped and eased. */
export const ramp = (t: number, a: number, b: number, easing: (x: number) => number = easeInOut) =>
  interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** Map t through keyframes [time, value][] with easing between keys. */
export const keys = (t: number, k: [number, number][], easing: (x: number) => number = easeInOut) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [t0, v0] = k[i];
    const [t1, v1] = k[i + 1];
    if (t <= t1) return lerp(v0, v1, easing(clamp((t - t0) / (t1 - t0))));
  }
  return k[k.length - 1][1];
};

/** Quick attack, exponential decay. Returns 0 before `at`. */
export const pulse = (t: number, at: number, attack = 0.06, decay = 0.25) => {
  if (t < at) return 0;
  if (t < at + attack) return (t - at) / attack;
  return Math.exp(-(t - at - attack) / decay);
};

/** Window: ramps up a→b, holds, ramps down c→d. */
export const window4 = (t: number, a: number, b: number, c: number, d: number) =>
  Math.min(ramp(t, a, b), 1 - ramp(t, c, d));

/** Deterministic random in [0,1) keyed by a seed string/number. */
export const rnd = (seed: string | number) => random(seed);
export const rndRange = (seed: string | number, lo: number, hi: number) => lo + random(seed) * (hi - lo);

/** Smooth deterministic noise in [-1,1] from a few sines (no frame state). */
export const wobble = (t: number, seed: number, speed = 1) =>
  (Math.sin(t * 1.7 * speed + seed * 12.9) * 0.6 +
    Math.sin(t * 2.9 * speed + seed * 4.1) * 0.3 +
    Math.sin(t * 5.3 * speed + seed * 7.7) * 0.1);

export const mixColor = (a: string, b: string, p: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (v: number, s: number) => (v >> s) & 255;
  const m = (s: number) => Math.round(lerp(ch(pa, s), ch(pb, s), clamp(p)));
  return `#${((m(16) << 16) | (m(8) << 8) | m(0)).toString(16).padStart(6, '0')}`;
};
