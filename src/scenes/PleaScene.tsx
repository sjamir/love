import React from 'react';
import {Build, Character, handWorld, lerpPose, Outfit, Pose, STAND} from '../components/Character';
import {Skyline} from '../components/City';
import {Particles} from '../components/Atmosphere';
import {Glow, Ring} from '../components/Light';
import {LyricBlock} from '../components/LyricText';
import {SceneFrame} from '../components/SceneFrame';
import {CUES, LYRICS} from '../data/lyricTiming';
import {palette} from '../data/palette';
import {light} from '../data/visualConfig';
import {clamp, easeInOut, easeOut, keys, lerp, mixColor, pulse, ramp, rndRange} from '../utils/anim';

// SCENE 05 — "Father, Father, Father help us"
// People in a dark open square look up. Each sung "Father" sends one pulse of
// warm light up from a different pair of hands, with a ring spreading from its
// origin, and reveals more of the people who were standing in the dark. The
// three lights meet in the clouds, which slowly open.

const GROUND = 975;
const OPENING = {x: 960, y: 70}; // world coords of the cloud opening

interface Person {
  x: number;
  h: number;
  build: Build;
  outfit: Outfit;
  hair?: 'short' | 'long' | 'bun' | 'cap';
  facing: 1 | -1;
  final: Pose;
  reveal: number; // which "Father" reveals them (0 = visible from the start)
}

const UP_V: Pose = {lean: -6, head: -40, turn: 0.7, aB: [158, 4], aF: [168, -4], lB: [-5, 0], lF: [5, 0]};
const ONE_UP: Pose = {lean: -4, head: -42, turn: 0.8, aB: [-6, 12], aF: [166, -8], lB: [-4, 0], lF: [4, 0]};
const PRAY: Pose = {lean: 6, head: -28, turn: 0.8, aB: [40, 128], aF: [52, 124], lB: [-3, 0], lF: [3, 0]};
const WIDE: Pose = {lean: -8, head: -46, turn: 0.6, aB: [132, 6], aF: [140, 2], lB: [-8, 0], lF: [8, 0]};
const KNEEL_UP: Pose = {lean: -6, head: -40, turn: 0.8, aB: [150, 6], aF: [168, 0], lB: [-4, -100], lF: [74, -140]};
const HEART: Pose = {lean: -2, head: -36, turn: 0.8, aB: [44, 120], aF: [160, -6], lB: [-3, 0], lF: [3, 0]};
const CHILD_UP: Pose = {lean: -4, head: -46, turn: 0.8, aB: [-4, 10], aF: [26, -6], lB: [-3, 0], lF: [3, 0]};
const HOLD_CHILD: Pose = {lean: 2, head: -34, turn: 0.8, aB: [40, 120], aF: [24, 6], lB: [-3, 0], lF: [3, 0]};

const PEOPLE: Person[] = [
  {x: 330, h: 430, build: 'adult', outfit: 'coat', facing: 1, final: UP_V, reveal: 1},
  {x: 475, h: 250, build: 'child', outfit: 'plain', facing: 1, final: CHILD_UP, reveal: 1},
  {x: 565, h: 420, build: 'adult', outfit: 'dress', hair: 'long', facing: -1, final: HOLD_CHILD, reveal: 1},
  {x: 820, h: 445, build: 'adult', outfit: 'plain', facing: 1, final: ONE_UP, reveal: 0},
  {x: 965, h: 400, build: 'elder', outfit: 'coat', hair: 'cap', facing: -1, final: PRAY, reveal: 0},
  {x: 1110, h: 455, build: 'adult', outfit: 'hood', facing: 1, final: WIDE, reveal: 0},
  {x: 1335, h: 430, build: 'adult', outfit: 'coat', facing: -1, final: KNEEL_UP, reveal: 2},
  {x: 1495, h: 385, build: 'adult', outfit: 'dress', hair: 'bun', facing: -1, final: HEART, reveal: 2},
  {x: 1650, h: 445, build: 'adult', outfit: 'plain', facing: -1, final: ONE_UP, reveal: 2},
];

// Which person sends each of the three pulses.
const SENDERS = [3, 2, 6];

const START: Pose = {...STAND, head: 18, turn: 0.7, aF: [4, 10], aB: [-4, 10]};

export const PleaScene: React.FC<{t: number}> = ({t}) => {
  const F = CUES.fathers;
  const cy = keys(t, [[10.2, 0], [12.95, 120]], easeInOut);
  const camera = {y: cy};

  const revealAt = [9.9, F[1], F[2]];
  const pulses = F.map((tf) => pulse(t, tf, 0.08, 0.5));
  const heard = F.filter((tf) => t >= tf).length; // how many pleas so far
  const open = ramp(t, CUES.cloudsOpen[0], CUES.cloudsOpen[1], easeInOut);
  const warmth = clamp(0.12 + heard * 0.12 + open * 0.5);
  const rimColor = mixColor(palette.mist, palette.guidance, clamp(heard / 3 + open));

  const people = PEOPLE.map((p, i) => {
    const rv = ramp(t, revealAt[p.reveal] - 0.05, revealAt[p.reveal] + 0.5, easeOut);
    const riseStart = Math.max(9.9, revealAt[p.reveal]) + rndRange(`pl-r-${i}`, 0, 0.5);
    const rise = ramp(t, riseStart, riseStart + 1.5, easeInOut);
    const pose = lerpPose(p.final.lB[1] < -50 ? {...START, lB: p.final.lB, lF: p.final.lF} : START, p.final, rise);
    return {...p, pose, opacity: p.reveal === 0 ? 1 : lerp(0.0, 1, rv), idx: i};
  });

  const orb = (k: number) => {
    const tf = F[k];
    if (t < tf) return null;
    const sender = people[SENDERS[k]];
    const [hx, hy] = handWorld({x: sender.x, y: GROUND, height: sender.h, pose: sender.pose, facing: sender.facing, build: sender.build});
    const p = ramp(t, tf, tf + light.pulseRise, easeInOut);
    const ctrl = {x: lerp(hx, OPENING.x, 0.2) + (k - 1) * 120, y: lerp(hy, OPENING.y, 0.55)};
    const at = (q: number) => {
      const a = (1 - q) * (1 - q);
      const b = 2 * (1 - q) * q;
      const c = q * q;
      return [a * hx + b * ctrl.x + c * OPENING.x, a * hy + b * ctrl.y + c * OPENING.y];
    };
    const [ox, oy] = at(p);
    const trail = Array.from({length: 10}).map((_, j) => at(Math.max(0, p - j * 0.025)));
    const ringP = ramp(t, tf, tf + 1.0, easeOut);
    const strength = [0.85, 0.95, 1.1][k];
    return (
      <g key={k}>
        <Ring x={hx} y={hy} r={lerp(10, light.pulseRingRadius, ringP)} color={palette.amber} opacity={(1 - ringP) * 0.55 * strength} width={3} />
        <Ring x={hx} y={hy} r={lerp(10, light.pulseRingRadius * 0.7, ringP)} color={palette.guidance} opacity={(1 - ringP) * 0.3} width={10} blur={6} />
        <polyline points={trail.map((q) => q.join(',')).join(' ')} fill="none" stroke={palette.amber} strokeWidth={7} strokeLinecap="round" opacity={0.3 * (1 - ramp(t, tf + light.pulseRise - 0.2, tf + light.pulseRise + 0.2))} style={{filter: 'blur(5px)'}} />
        <Glow x={ox} y={oy} r={lerp(70, 50, p) + 50 * pulses[k]} color={palette.amber} opacity={strength * (p < 1 ? 1 : 0.6)} />
      </g>
    );
  };

  // Cloud banks (world coords). Brighten with each plea and around the opening.
  const clouds = Array.from({length: 22}).map((_, i) => {
    const layer = i % 3;
    const x = ((rndRange(`cl-x-${i}`, -300, 2200) + t * (6 + layer * 6)) % 2500) - 300;
    const y = rndRange(`cl-y-${i}`, -560, 160) - layer * 40;
    const rx = rndRange(`cl-r-${i}`, 260, 520);
    const near = Math.exp(-Math.pow((x - OPENING.x) / 520, 2) - Math.pow((y - OPENING.y) / 260, 2));
    return {x, y, rx, ry: rx * 0.32, op: 0.1 + layer * 0.05 + warmth * 0.12 + near * open * 0.25, near};
  });

  const L = LYRICS.plea;
  return (
    <SceneFrame
      background={palette.midnight}
      camera={camera}
      world={
        <>
          <defs>
            <linearGradient id="pl-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#05080D" />
              <stop offset="0.6" stopColor={palette.midnight} />
              <stop offset="1" stopColor={palette.deepBlue} />
            </linearGradient>
            <linearGradient id="pl-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={palette.asphalt} />
              <stop offset="1" stopColor={palette.silhouette} />
            </linearGradient>
          </defs>
          <rect x={-300} y={-1000} width={2520} height={1880} fill="url(#pl-sky)" />
          <Glow x={OPENING.x} y={OPENING.y} r={lerp(80, 560, open)} ry={lerp(50, 300, open)} color={palette.guidance} opacity={0.15 + 0.85 * open} core={0.06} />
          <g style={{filter: 'blur(26px)'}}>
            {clouds.map((c, i) => (
              <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill={mixColor(palette.mist, palette.guidance, c.near * open * 0.6)} opacity={c.op} />
            ))}
          </g>
          <Skyline seed={51} x0={-300} x1={2220} baseY={880} minH={70} maxH={300} color={mixColor(palette.asphalt, palette.midnight, 0.4)} windowColor={palette.mist} litFraction={0.06} windowOpacity={0.35} warmColor={palette.amber} warmFraction={0.3 * warmth} t={t} />
          <rect x={-300} y={870} width={2520} height={600} fill="url(#pl-ground)" />
          <Glow x={960} y={GROUND} r={900} ry={60} color={palette.guidance} opacity={0.12 * warmth} core={0.05} />
          {people.map((p) => (
            <Character
              key={p.idx}
              x={p.x}
              y={GROUND}
              height={p.h}
              pose={p.pose}
              facing={p.facing}
              build={p.build}
              outfit={p.outfit}
              hair={p.hair}
              opacity={p.opacity}
              rim={{color: rimColor, dx: 0, dy: -3, opacity: 0.2 + 0.7 * warmth + 0.4 * (SENDERS.includes(p.idx) ? pulses[SENDERS.indexOf(p.idx)] : 0)}}
            />
          ))}
          {orb(0)}
          {orb(1)}
          {orb(2)}
          <Particles t={t} seed={52} count={36} color={palette.guidance} opacity={0.35 * warmth} area={{x: 200, y: -300, w: 1500, h: 1100}} size={[1, 2.6]} rise={30} glow />
        </>
      }
      overlay={
        <LyricBlock
          t={t}
          style="solemn"
          exitAt={12.85}
          lines={[
            {words: L.words.slice(0, 3), x: 960, y: 210, align: 'center', size: 84},
            {words: L.words.slice(3), x: 960, y: 312, align: 'center', size: 84},
          ]}
        />
      }
    />
  );
};
