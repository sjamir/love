import React from 'react';
import {palette} from '../data/palette';
import {clamp, mixColor, rnd, rndRange} from '../utils/anim';

// ─────────────────────────────────────────────────────────────────────────────
// Flat skyline: a deterministic row of building silhouettes with windows.
// ─────────────────────────────────────────────────────────────────────────────
export const Skyline: React.FC<{
  seed: number;
  x0: number;
  x1: number;
  baseY: number;
  minH: number;
  maxH: number;
  color: string;
  windowColor?: string;
  litFraction?: number;
  windowOpacity?: number;
  minW?: number;
  maxW?: number;
  warmColor?: string;
  warmFraction?: number;
  t?: number;
}> = ({seed, x0, x1, baseY, minH, maxH, color, windowColor = palette.mist, litFraction = 0.12, windowOpacity = 0.5, minW = 60, maxW = 160, warmColor, warmFraction = 0, t = 0}) => {
  const buildings: React.ReactNode[] = [];
  let x = x0;
  let i = 0;
  while (x < x1) {
    const w = rndRange(`${seed}-w-${i}`, minW, maxW);
    const h = rndRange(`${seed}-h-${i}`, minH, maxH);
    const top = baseY - h;
    const win: React.ReactNode[] = [];
    const cols = Math.max(1, Math.floor(w / 26));
    const rows = Math.floor((h - 30) / 30);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${seed}-${i}-${r}-${c}`;
        const lit = rnd(key) < litFraction;
        if (!lit) continue;
        const warm = warmColor && rnd(`${key}-warm`) < warmFraction;
        const flick = 0.75 + 0.25 * Math.sin(t * 0.7 + rnd(`${key}-f`) * 20);
        win.push(
          <rect
            key={key}
            x={x + 8 + c * ((w - 16) / cols)}
            y={top + 18 + r * 30}
            width={Math.max(4, (w - 16) / cols - 9)}
            height={13}
            fill={warm ? warmColor : windowColor}
            opacity={windowOpacity * flick * (warm ? 1.3 : 1)}
          />,
        );
      }
    }
    const hasSpire = rnd(`${seed}-sp-${i}`) < 0.15;
    buildings.push(
      <g key={i}>
        <rect x={x} y={top} width={w + 1} height={h + 400} fill={color} />
        {hasSpire && <rect x={x + w / 2 - 3} y={top - 50} width={6} height={50} fill={color} />}
        {win}
      </g>,
    );
    x += w;
    i++;
  }
  return <g>{buildings}</g>;
};

// ─────────────────────────────────────────────────────────────────────────────
// One-point perspective street, shared by the opening (violence) scene and the
// guidance scene so the city is recognisably the same place.
// World: X sideways (px at depth 1), Y downward from the horizon, z = depth.
// ─────────────────────────────────────────────────────────────────────────────

export interface StreetView {
  vpX: number;
  vpY: number;
  groundY: number; // camera height: world Y of the ground plane
}

export const project = (v: StreetView, X: number, Y: number, z: number): [number, number] => [v.vpX + X / z, v.vpY + Y / z];

export const FACADE_X = 1150;
export const CURB_X = 760;

export interface Lamp {
  side: -1 | 1;
  z: number;
}

export const STREET_LAMPS: Lamp[] = [
  {side: 1, z: 1.55},
  {side: -1, z: 2.0},
  {side: 1, z: 2.6},
  {side: -1, z: 3.6},
  {side: 1, z: 4.8},
  {side: -1, z: 7},
  {side: 1, z: 9.5},
  {side: -1, z: 13},
];

const BUILDINGS = (() => {
  const out: {side: -1 | 1; z1: number; z2: number; h: number; tone: number; i: number}[] = [];
  for (const side of [-1, 1] as const) {
    let z = 0.7;
    let i = 0;
    while (z < 26) {
      const z2 = z * rndRange(`b-${side}-${i}-d`, 1.18, 1.45);
      out.push({side, z1: z, z2, h: rndRange(`b-${side}-${i}-h`, 1100, 2600), tone: rnd(`b-${side}-${i}-t`), i});
      z = z2;
      i++;
    }
  }
  return out;
})();

export const lampHead = (v: StreetView, l: Lamp): [number, number] => project(v, l.side * (CURB_X + 10) - l.side * 150, v.groundY - 1050, l.z);
export const lampGround = (v: StreetView, l: Lamp): [number, number] => project(v, l.side * (CURB_X + 10) - l.side * 150, v.groundY, l.z);

export const PerspectiveStreet: React.FC<{
  view: StreetView;
  t: number;
  lampColor: string;
  lampIntensity: (i: number, lamp: Lamp) => number;
  skyTop: string;
  skyBottom: string;
  fogColor?: string;
  buildingColor?: string;
  windowColor?: string;
  windowLit?: number;
  windowGlow?: (side: -1 | 1, z: number, i: number) => number;
  windowGlowColor?: string;
  roofGlow?: number;
  roofGlowColor?: string;
  wet?: number;
}> = ({
  view,
  t,
  lampColor,
  lampIntensity,
  skyTop,
  skyBottom,
  fogColor = palette.mist,
  buildingColor = palette.asphalt,
  windowColor = palette.sky,
  windowLit = 0.12,
  windowGlow,
  windowGlowColor = palette.guidance,
  roofGlow = 0,
  roofGlowColor = palette.guidance,
  wet = 1,
}) => {
  const P = (X: number, Y: number, z: number) => project(view, X, Y, z);
  const pts = (arr: [number, number][]) => arr.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const G = view.groundY;
  const zFar = 40;
  // Sort far to near so nearer facades overlap farther ones.
  const sorted = [...BUILDINGS].sort((a, b) => b.z1 - a.z1);
  const id = `st-${Math.round(view.vpY)}`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop} />
          <stop offset="1" stopColor={skyBottom} />
        </linearGradient>
        <linearGradient id={`${id}-road`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mixColor(palette.asphalt, fogColor, 0.25)} />
          <stop offset="0.25" stopColor={palette.asphalt} />
          <stop offset="1" stopColor={palette.midnight} />
        </linearGradient>
        <radialGradient id={`${id}-pool`}>
          <stop offset="0" stopColor={lampColor} stopOpacity="0.38" />
          <stop offset="0.5" stopColor={lampColor} stopOpacity="0.08" />
          <stop offset="1" stopColor={lampColor} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.12" stopColor={lampColor} stopOpacity="0.7" />
          <stop offset="0.4" stopColor={lampColor} stopOpacity="0.15" />
          <stop offset="1" stopColor={lampColor} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-refl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lampColor} stopOpacity="0.7" />
          <stop offset="1" stopColor={lampColor} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lampColor} stopOpacity="0.12" />
          <stop offset="1" stopColor={lampColor} stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id={`${id}-fog`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fogColor} stopOpacity="0" />
          <stop offset="0.5" stopColor={fogColor} stopOpacity="0.12" />
          <stop offset="1" stopColor={fogColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={-600} y={-1400} width={3120} height={view.vpY + 1420} fill={`url(#${id}-sky)`} />
      <Skyline
        seed={7}
        x0={view.vpX - 420}
        x1={view.vpX + 420}
        baseY={view.vpY + 6}
        minH={30}
        maxH={120}
        minW={18}
        maxW={50}
        color={mixColor(buildingColor, fogColor, 0.28)}
        windowColor={windowColor}
        litFraction={0.15}
        windowOpacity={0.35}
        t={t}
      />
      {/* ground: sidewalks + road */}
      <polygon points={pts([P(-FACADE_X * 3, G, 0.33), P(FACADE_X * 3, G, 0.33), P(FACADE_X, G, zFar), P(-FACADE_X, G, zFar)])} fill={mixColor(palette.asphalt, palette.midnight, 0.2)} />
      <polygon points={pts([P(-CURB_X, G, 0.33), P(CURB_X, G, 0.33), P(CURB_X, G, zFar), P(-CURB_X, G, zFar)])} fill={`url(#${id}-road)`} />
      {/* curb lines */}
      {[-1, 1].map((s) => (
        <line key={s} x1={P(s * CURB_X, G, 0.5)[0]} y1={P(s * CURB_X, G, 0.5)[1]} x2={P(s * CURB_X, G, zFar)[0]} y2={P(s * CURB_X, G, zFar)[1]} stroke={palette.graphite} strokeWidth={3} opacity={0.8} />
      ))}
      {/* centre dashes */}
      {Array.from({length: 16}).map((_, i) => {
        const z1 = 0.6 * Math.pow(1.32, i);
        const z2 = z1 * 1.14;
        return <polygon key={i} points={pts([P(-14, G, z1), P(14, G, z1), P(14, G, z2), P(-14, G, z2)])} fill={palette.mist} opacity={0.18} />;
      })}
      {/* facades */}
      {sorted.map((b) => {
        const X = b.side * FACADE_X;
        const top = G - b.h;
        const base = mixColor(buildingColor, palette.midnight, 0.45 + b.tone * 0.45);
        const fogged = mixColor(base, fogColor, clamp((b.z1 - 2) / 22) * 0.22);
        const windows: React.ReactNode[] = [];
        const cols = Math.max(1, Math.round((b.z2 - b.z1) * 3.2 / Math.max(1, b.z1 * 0.35)));
        const rows = Math.floor((b.h - 380) / 240);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < Math.min(cols, 6); c++) {
            const key = `w-${b.side}-${b.i}-${r}-${c}`;
            const zz1 = b.z1 + ((b.z2 - b.z1) * (c + 0.25)) / Math.min(cols, 6);
            const zz2 = b.z1 + ((b.z2 - b.z1) * (c + 0.72)) / Math.min(cols, 6);
            const y1 = G - 360 - r * 240;
            const y2 = y1 - 150;
            const glow = windowGlow ? windowGlow(b.side, zz1, r) : 0;
            const lit = rnd(key) < windowLit;
            const op = Math.max(lit ? 0.22 + 0.25 * rnd(`${key}-o`) : 0.05, glow);
            const col = glow > 0.05 ? mixColor(lit ? windowColor : palette.graphite, windowGlowColor, clamp(glow * 1.4)) : lit ? windowColor : palette.graphite;
            windows.push(<polygon key={key} points={pts([P(X, y1, zz1), P(X, y2, zz1), P(X, y2, zz2), P(X, y1, zz2)])} fill={col} opacity={op} />);
          }
        }
        return (
          <g key={`${b.side}-${b.i}`}>
            <polygon points={pts([P(X, G, b.z1), P(X, top, b.z1), P(X, top, b.z2), P(X, G, b.z2)])} fill={fogged} />
            {/* building front edge (gives facades thickness) */}
            <polygon
              points={pts([P(X, G, b.z1), P(X, top, b.z1), P(X + b.side * 260, top, b.z1), P(X + b.side * 260, G, b.z1)])}
              fill={mixColor(fogged, palette.midnight, 0.35)}
            />
            {windows}
            {roofGlow > 0 && (
              <line x1={P(X, top, b.z1)[0]} y1={P(X, top, b.z1)[1]} x2={P(X, top, b.z2)[0]} y2={P(X, top, b.z2)[1]} stroke={roofGlowColor} strokeWidth={2} opacity={0.55 * roofGlow * clamp(1.2 - b.z1 / 14)} />
            )}
          </g>
        );
      })}
      {/* horizon fog */}
      <rect x={-600} y={view.vpY - 140} width={3120} height={280} fill={`url(#${id}-fog)`} />
      {/* lamps, far to near */}
      {STREET_LAMPS.map((l, i) => ({l, i}))
        .sort((a, b) => b.l.z - a.l.z)
        .map(({l, i}) => {
          const k = clamp(lampIntensity(i, l), 0, 1.5);
          const poleBase = P(l.side * (CURB_X + 10), G, l.z);
          const poleTop = P(l.side * (CURB_X + 10), G - 1080, l.z);
          const head = lampHead(view, l);
          const ground = lampGround(view, l);
          const s = 1 / l.z;
          return (
            <g key={i}>
              {/* light cone */}
              <polygon
                points={pts([[head[0] - 14 * s, head[1]], [head[0] + 14 * s, head[1]], [ground[0] + 330 * s, ground[1]], [ground[0] - 330 * s, ground[1]]])}
                fill={`url(#${id}-cone)`}
                opacity={k}
              />
              {/* ground pool */}
              <ellipse cx={ground[0]} cy={ground[1]} rx={620 * s} ry={140 * s} fill={`url(#${id}-pool)`} opacity={k} />
              {/* wet reflection streak */}
              {wet > 0 && (
                <rect x={ground[0] - 18 * s} y={ground[1]} width={36 * s} height={420 * s} fill={`url(#${id}-refl)`} opacity={k * 0.32 * wet} style={{filter: `blur(${Math.max(1, 8 * s)}px)`}} />
              )}
              <line x1={poleBase[0]} y1={poleBase[1]} x2={poleTop[0]} y2={poleTop[1]} stroke={palette.silhouette} strokeWidth={Math.max(1.5, 16 * s)} />
              <line x1={poleTop[0]} y1={poleTop[1]} x2={head[0]} y2={head[1]} stroke={palette.silhouette} strokeWidth={Math.max(1.5, 12 * s)} />
              <ellipse cx={head[0]} cy={head[1] + 4 * s} rx={46 * s} ry={14 * s} fill={palette.silhouette} />
              <circle cx={head[0]} cy={head[1] + 14 * s} r={150 * s} fill={`url(#${id}-glow)`} opacity={k * 0.85} />
            </g>
          );
        })}
    </g>
  );
};
