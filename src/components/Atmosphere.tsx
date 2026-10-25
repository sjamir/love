import React from 'react';
import {useCurrentFrame} from 'remotion';
import {HEIGHT, WIDTH, effects} from '../data/visualConfig';
import {rnd, rndRange} from '../utils/anim';

/** Deterministic falling rain streaks. */
export const Rain: React.FC<{
  t: number;
  seed: number;
  count: number;
  color: string;
  opacity: number;
  speed?: number;
  length?: number;
  angle?: number;
  area?: {x: number; y: number; w: number; h: number};
  width?: number;
}> = ({t, seed, count, color, opacity, speed = 1900, length = 60, angle = 8, area = {x: -100, y: -100, w: WIDTH + 200, h: HEIGHT + 200}, width = 1.6}) => {
  const dx = Math.tan((angle * Math.PI) / 180) * length;
  return (
    <g stroke={color} strokeWidth={width} strokeLinecap="round" opacity={opacity}>
      {Array.from({length: count}).map((_, i) => {
        const x0 = area.x + rnd(`${seed}-rx-${i}`) * area.w;
        const sp = speed * rndRange(`${seed}-rs-${i}`, 0.75, 1.25);
        const y = area.y + ((rnd(`${seed}-ry-${i}`) * area.h + sp * t) % area.h);
        const x = x0 + Math.tan((angle * Math.PI) / 180) * (y - area.y);
        const op = rndRange(`${seed}-ro-${i}`, 0.3, 1);
        return <line key={i} x1={x} y1={y} x2={x - dx} y2={y - length} opacity={op} />;
      })}
    </g>
  );
};

/** Slow drifting fog / haze blobs. */
export const Fog: React.FC<{t: number; seed: number; count: number; color: string; opacity: number; y: number; spread: number; size?: number}> = ({
  t,
  seed,
  count,
  color,
  opacity,
  y,
  spread,
  size = 420,
}) => (
  <g style={{filter: 'blur(40px)'}} opacity={opacity}>
    {Array.from({length: count}).map((_, i) => {
      const sp = rndRange(`${seed}-fs-${i}`, 8, 26);
      const x = ((rnd(`${seed}-fx-${i}`) * (WIDTH + 800) + sp * t) % (WIDTH + 800)) - 400;
      const yy = y + rndRange(`${seed}-fy-${i}`, -spread, spread);
      const r = size * rndRange(`${seed}-fr-${i}`, 0.6, 1.3);
      return <ellipse key={i} cx={x} cy={yy} rx={r} ry={r * 0.28} fill={color} opacity={rndRange(`${seed}-fo-${i}`, 0.4, 1)} />;
    })}
  </g>
);

/** Floating dust / light particles. */
export const Particles: React.FC<{
  t: number;
  seed: number;
  count: number;
  color: string;
  opacity: number;
  area: {x: number; y: number; w: number; h: number};
  size?: [number, number];
  rise?: number;
  drift?: number;
  glow?: boolean;
}> = ({t, seed, count, color, opacity, area, size = [1.5, 4], rise = 18, drift = 10, glow = false}) => (
  <g opacity={opacity} style={glow ? {filter: 'blur(1.2px)'} : undefined}>
    {Array.from({length: count}).map((_, i) => {
      const r = rndRange(`${seed}-pr-${i}`, size[0], size[1]);
      const sp = rise * rndRange(`${seed}-psp-${i}`, 0.5, 1.5);
      const x = area.x + rnd(`${seed}-px-${i}`) * area.w + Math.sin(t * 0.6 + i) * drift;
      const y = area.y + ((((rnd(`${seed}-py-${i}`) * area.h - sp * t) % area.h) + area.h) % area.h);
      const tw = 0.55 + 0.45 * Math.sin(t * 2.1 + rnd(`${seed}-pt-${i}`) * 30);
      return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={tw} />;
    })}
  </g>
);

/** Film grain + vignette applied over the whole frame. */
export const FilmFinish: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = frame % 12;
  return (
    <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <defs>
        <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={effects.vignetteStrength} />
        </radialGradient>
        <filter id={`grain-${seed}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="url(#vignette)" />
      <rect width={WIDTH} height={HEIGHT} filter={`url(#grain-${seed})`} opacity={effects.grainOpacity} style={{mixBlendMode: 'overlay'}} />
    </svg>
  );
};
