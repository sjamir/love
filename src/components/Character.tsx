import React from 'react';
import {clamp, lerp} from '../utils/anim';
import {palette} from '../data/palette';

// ─────────────────────────────────────────────────────────────────────────────
// Silhouette character rig.
// Angles are in degrees, 0 = pointing straight down, positive = toward the
// direction the character faces. Limb = [upper segment angle, bend of lower
// segment relative to upper]. "B" = far limb, "F" = near limb.
// ─────────────────────────────────────────────────────────────────────────────

export type Limb = [number, number];

export interface Pose {
  lean: number; // torso lean, + forward
  head: number; // head tilt, + looks down, − looks up
  turn: number; // -1..1 profile strength; sign = which side the face points
  aB: Limb;
  aF: Limb;
  lB: Limb;
  lF: Limb;
  seat?: boolean; // ground at the hips instead of the feet
}

export const STAND: Pose = {lean: 0, head: 0, turn: 0.8, aB: [-6, 8], aF: [6, 8], lB: [-3, 0], lF: [3, 0]};

export const lerpPose = (a: Pose, b: Pose, p: number): Pose => {
  const L = (x: Limb, y: Limb): Limb => [lerp(x[0], y[0], p), lerp(x[1], y[1], p)];
  return {
    lean: lerp(a.lean, b.lean, p),
    head: lerp(a.head, b.head, p),
    turn: lerp(a.turn, b.turn, p),
    aB: L(a.aB, b.aB),
    aF: L(a.aF, b.aF),
    lB: L(a.lB, b.lB),
    lF: L(a.lF, b.lF),
    seat: p < 0.5 ? a.seat : b.seat,
  };
};

/** Walk cycle; phase in cycles, amount 0..1 blends from standing. */
export const walkPose = (phase: number, amount = 1, base: Pose = STAND): Pose => {
  const s = Math.sin(phase * Math.PI * 2);
  const c = Math.cos(phase * Math.PI * 2);
  const k = clamp(amount);
  return {
    ...base,
    lean: base.lean + 4 * k,
    aB: [base.aB[0] + 20 * s * k, base.aB[1] + 12 * k],
    aF: [base.aF[0] - 20 * s * k, base.aF[1] + 12 * k],
    lB: [base.lB[0] - 24 * s * k, base.lB[1] - Math.max(0, c) * 30 * k],
    lF: [base.lF[0] + 24 * s * k, base.lF[1] - Math.max(0, -c) * 30 * k],
  };
};

export type Build = 'adult' | 'child' | 'elder';
export type Outfit = 'plain' | 'coat' | 'hood' | 'dress' | 'suit';
export type Prop = 'gun' | 'cup' | 'none';

const PROPORTIONS: Record<Build, {leg: number; torso: number; neck: number; headR: number; upper: number; fore: number; limbW: number; sw: number; hw: number}> = {
  adult: {leg: 0.245, torso: 0.31, neck: 0.03, headR: 0.064, upper: 0.165, fore: 0.16, limbW: 0.066, sw: 0.112, hw: 0.084},
  elder: {leg: 0.24, torso: 0.3, neck: 0.03, headR: 0.066, upper: 0.16, fore: 0.155, limbW: 0.066, sw: 0.11, hw: 0.092},
  child: {leg: 0.2, torso: 0.26, neck: 0.025, headR: 0.09, upper: 0.14, fore: 0.13, limbW: 0.08, sw: 0.1, hw: 0.088},
};

type V = [number, number];
const dir = (deg: number): V => {
  const r = (deg * Math.PI) / 180;
  return [Math.sin(r), Math.cos(r)];
};
const add = (a: V, b: V, s = 1): V => [a[0] + b[0] * s, a[1] + b[1] * s];

/** Chaikin corner-cutting: rounds a closed polygon into an organic outline. */
const chaikin = (pts: V[], iterations = 2): V[] => {
  let p = pts;
  for (let k = 0; k < iterations; k++) {
    const out: V[] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i];
      const b = p[(i + 1) % p.length];
      out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
    }
    p = out;
  }
  return p;
};

export interface Joints {
  hip: V;
  neck: V;
  shoulder: V;
  head: V;
  headR: number;
  elbowB: V;
  handB: V;
  elbowF: V;
  handF: V;
  foreF: number;
  kneeB: V;
  footB: V;
  kneeF: V;
  footF: V;
  unit: number;
}

/** Solve joint positions in local px (feet/ground at y=0, x=0, facing +x). */
export const solve = (pose: Pose, height: number, build: Build = 'adult'): Joints => {
  const P0 = PROPORTIONS[build];
  const total = 2 * P0.leg + P0.torso + P0.neck + 2 * P0.headR;
  const u = height / total;
  const P = {...P0};
  const leg = P.leg * u;
  const limb = (s: V, a: Limb, l1: number, l2: number) => {
    const e = add(s, dir(a[0]), l1);
    const h = add(e, dir(a[0] + a[1]), l2);
    return {e, h, a2: a[0] + a[1]};
  };
  // Solve legs from hip at origin, then ground.
  const hip0: V = [0, 0];
  const LB = limb(hip0, pose.lB, leg, leg);
  const LF = limb(hip0, pose.lF, leg, leg);
  const lowest = pose.seat ? 0 : Math.max(LB.h[1], LF.h[1], LB.e[1], LF.e[1]);
  const hip: V = [0, -lowest];
  const off = (p: V): V => [p[0], p[1] - lowest];
  const tdir = dir(180 - pose.lean);
  const neck = add(hip, tdir, P.torso * u);
  const shoulder = add(hip, tdir, (P.torso - 0.035) * u);
  const head = add(neck, dir(180 - pose.lean - pose.head * 0.35), (P.neck + P.headR) * u);
  const AB = limb(shoulder, pose.aB, P.upper * u, P.fore * u);
  const AF = limb(shoulder, pose.aF, P.upper * u, P.fore * u);
  return {
    hip,
    neck,
    shoulder,
    head,
    headR: P.headR * u,
    elbowB: AB.e,
    handB: AB.h,
    elbowF: AF.e,
    handF: AF.h,
    foreF: AF.a2,
    kneeB: off(LB.e),
    footB: off(LB.h),
    kneeF: off(LF.e),
    footF: off(LF.h),
    unit: u,
  };
};

export interface CharacterProps {
  x: number;
  y: number; // ground line
  height: number;
  pose: Pose;
  facing?: 1 | -1;
  build?: Build;
  outfit?: Outfit;
  color?: string;
  rim?: {color: string; dx: number; dy: number; opacity?: number};
  opacity?: number;
  rotate?: number; // whole-body rotation around the feet (for falls)
  prop?: Prop;
  propOpacity?: number;
  blur?: number;
  hair?: 'short' | 'long' | 'bun' | 'cap';
}

const Body: React.FC<{j: Joints; pose: Pose; build: Build; outfit: Outfit; color: string; prop: Prop; propOpacity: number; hair: string}> = ({
  j,
  pose,
  build,
  outfit,
  color,
  prop,
  propOpacity,
  hair,
}) => {
  const u = j.unit;
  const P = PROPORTIONS[build];
  const lw = P.limbW * u;
  const tdir = dir(180 - pose.lean);
  const perp: V = [tdir[1] * -1, tdir[0]]; // perpendicular to torso
  const sw = P.sw * u;
  const hw = P.hw * u;
  const waist = add(j.hip, tdir, P.torso * u * 0.42);
  const chest = add(j.hip, tdir, P.torso * u * 0.78);
  const torso = chaikin([
    add(j.hip, perp, hw),
    add(waist, perp, hw * 0.78),
    add(chest, perp, sw * 0.98),
    add(j.shoulder, perp, sw),
    add(add(j.neck, tdir, 0.012 * u), perp, sw * 0.45),
    add(add(j.neck, tdir, 0.012 * u), perp, -sw * 0.45),
    add(j.shoulder, perp, -sw),
    add(chest, perp, -sw * 0.98),
    add(waist, perp, -hw * 0.78),
    add(j.hip, perp, -hw),
  ]);
  const pts = (arr: V[]) => arr.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const limbPath = (a: V, b: V, c: V) => `M${a[0]},${a[1]} L${b[0]},${b[1]} L${c[0]},${c[1]}`;
  const legW = lw * 1.22;
  const nose = clamp(Math.abs(pose.turn));
  const noseSide = Math.sign(pose.turn) || 1;
  const nd = dir(90 * noseSide - pose.head * noseSide);
  const noseTip = add(j.head, nd, j.headR * (1 + 0.22 * nose));
  const noseBase1 = add(j.head, dir(90 * noseSide - pose.head * noseSide - 35), j.headR * 0.92);
  const noseBase2 = add(j.head, dir(90 * noseSide - pose.head * noseSide + 30), j.headR * 0.92);

  // Coat / dress hem below the hips.
  const hem =
    outfit === 'coat' || outfit === 'dress' || outfit === 'hood'
      ? (() => {
          const kneeMid: V = [(j.kneeB[0] + j.kneeF[0]) / 2, (j.kneeB[1] + j.kneeF[1]) / 2];
          const flare = outfit === 'dress' ? 1.9 : 1.35;
          const reach = outfit === 'dress' ? 0.95 : outfit === 'coat' ? 0.85 : 0.35;
          const bottom: V = [lerp(j.hip[0], kneeMid[0], reach), lerp(j.hip[1], kneeMid[1], reach)];
          return chaikin([add(j.shoulder, perp, sw * 0.95), add(j.hip, perp, hw * 1.1), add(bottom, perp, hw * flare), add(bottom, perp, -hw * flare), add(j.hip, perp, -hw * 1.1), add(j.shoulder, perp, -sw * 0.95)], 1);
        })()
      : null;

  const footLen = 0.05 * u * (build === 'child' ? 0.8 : 1);
  return (
    <g fill={color} stroke={color} strokeLinecap="round" strokeLinejoin="round">
      {/* far limbs */}
      <path d={limbPath(j.shoulder, j.elbowB, j.handB)} strokeWidth={lw} fill="none" />
      <path d={limbPath(j.hip, j.kneeB, j.footB)} strokeWidth={legW} fill="none" />
      <path d={`M${j.footB[0]},${j.footB[1]} l${footLen},0`} strokeWidth={legW * 0.75} />
      {/* torso */}
      <polygon points={pts(torso)} strokeWidth={lw * 0.3} />
      {hem && <polygon points={pts(hem as V[])} strokeWidth={lw * 0.4} />}
      {/* near limbs */}
      <path d={limbPath(j.hip, j.kneeF, j.footF)} strokeWidth={legW} fill="none" />
      <path d={`M${j.footF[0]},${j.footF[1]} l${footLen},0`} strokeWidth={legW * 0.75} />
      {/* neck + head */}
      <path d={`M${j.neck[0]},${j.neck[1]} L${j.head[0]},${j.head[1]}`} strokeWidth={lw * 0.9} />
      <circle cx={j.head[0]} cy={j.head[1]} r={j.headR} stroke="none" />
      {nose > 0.05 && <polygon points={pts([noseBase1, noseTip, noseBase2])} stroke="none" opacity={nose} />}
      {outfit === 'hood' && (
        <ellipse cx={j.head[0] - noseSide * j.headR * 0.25} cy={j.head[1] - j.headR * 0.1} rx={j.headR * 1.22} ry={j.headR * 1.25} stroke="none" />
      )}
      {hair === 'long' && (
        <path
          d={`M${j.head[0] - j.headR * noseSide * 0.2},${j.head[1] - j.headR} q${-noseSide * j.headR * 1.4},${j.headR * 0.4} ${-noseSide * j.headR * 0.9},${j.headR * 2.4} l${noseSide * j.headR * 0.8},0 z`}
          stroke="none"
        />
      )}
      {hair === 'bun' && <circle cx={j.head[0] - noseSide * j.headR * 0.85} cy={j.head[1] - j.headR * 0.55} r={j.headR * 0.45} stroke="none" />}
      {hair === 'cap' && (
        <path d={`M${j.head[0] - j.headR},${j.head[1] - j.headR * 0.15} a${j.headR},${j.headR} 0 0 1 ${j.headR * 2},0 l${noseSide * j.headR * 0.7},${j.headR * 0.12} z`} stroke="none" />
      )}
      <path d={limbPath(j.shoulder, j.elbowF, j.handF)} strokeWidth={lw} fill="none" />
      <circle cx={j.handF[0]} cy={j.handF[1]} r={lw * 0.62} stroke="none" />
      <circle cx={j.handB[0]} cy={j.handB[1]} r={lw * 0.62} stroke="none" />
      {prop === 'gun' && propOpacity > 0 && (
        <g transform={`translate(${j.handF[0]},${j.handF[1]}) rotate(${-j.foreF + 90})`} opacity={propOpacity} stroke="none">
          <rect x={-0.01 * u} y={-0.014 * u} width={0.075 * u} height={0.022 * u} rx={0.004 * u} />
          <rect x={-0.004 * u} y={-0.004 * u} width={0.02 * u} height={0.04 * u} rx={0.004 * u} transform={`rotate(14)`} />
        </g>
      )}
      {prop === 'cup' && (
        <rect x={j.handF[0] - 0.018 * u} y={j.handF[1] - 0.05 * u} width={0.036 * u} height={0.045 * u} rx={0.005 * u} stroke="none" />
      )}
    </g>
  );
};

export const Character: React.FC<CharacterProps> = ({
  x,
  y,
  height,
  pose,
  facing = 1,
  build = 'adult',
  outfit = 'plain',
  color = palette.silhouette,
  rim,
  opacity = 1,
  rotate = 0,
  prop = 'none',
  propOpacity = 1,
  blur = 0,
  hair = 'short',
}) => {
  const j = solve(pose, height, build);
  const pivot = pose.seat ? j.hip : ([0, 0] as V);
  const body = (c: string) => (
    <Body j={j} pose={pose} build={build} outfit={outfit} color={c} prop={prop} propOpacity={propOpacity} hair={hair} />
  );
  return (
    <g
      transform={`translate(${x},${y}) scale(${facing},1) rotate(${rotate * facing},${pivot[0]},${pivot[1]})`}
      opacity={opacity}
      style={blur > 0 ? {filter: `blur(${blur}px)`} : undefined}
    >
      {rim && (
        <g transform={`translate(${rim.dx * facing},${rim.dy})`} opacity={rim.opacity ?? 1}>
          {body(rim.color)}
        </g>
      )}
      {body(color)}
    </g>
  );
};

/** World-space hand position (useful for attaching effects to hands). */
export const handWorld = (
  props: Pick<CharacterProps, 'x' | 'y' | 'height' | 'pose' | 'facing' | 'build'>,
  which: 'F' | 'B' = 'F',
): V => {
  const j = solve(props.pose, props.height, props.build ?? 'adult');
  const h = which === 'F' ? j.handF : j.handB;
  return [props.x + h[0] * (props.facing ?? 1), props.y + h[1]];
};

export const headWorld = (props: Pick<CharacterProps, 'x' | 'y' | 'height' | 'pose' | 'facing' | 'build'>): V => {
  const j = solve(props.pose, props.height, props.build ?? 'adult');
  return [props.x + j.head[0] * (props.facing ?? 1), props.y + j.head[1]];
};
