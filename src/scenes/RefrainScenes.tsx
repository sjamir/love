import React from 'react';
import {Build, Character, handWorld, lerpPose, Outfit, Pose, STAND, walkPose} from '../components/Character';
import {Skyline} from '../components/City';
import {Particles} from '../components/Atmosphere';
import {Glow, LightLine, QuestionMark} from '../components/Light';
import {LyricBlock} from '../components/LyricText';
import {SceneFrame} from '../components/SceneFrame';
import {CUES, LYRICS} from '../data/lyricTiming';
import {palette} from '../data/palette';
import {typeScale} from '../data/visualConfig';
import {clamp, easeInOut, easeOut, keys, lerp, mixColor, ramp, rnd} from '../utils/anim';
import {QM} from './QuestioningScene';

// SCENES 08A / 08B + ENDING — "(Where's the love?)" ×2
// Both refrains share one stage so the viewer recognises the composition: two
// groups of people in shadow, separated by a dark fissure, the question mark
// hanging between them.
//   08A asks the question: one person looks across; the gap stays open.
//   08B suggests an answer: the warm dot of the question falls into the gap and
//   fills it with light; one person steps forward, another answers, their hands
//   meet over the gap, and the light spreads to the people beside them while
//   the camera pulls back over the city. Fade to black on the audio's end.

const GROUND = 960;
const HORIZON = 700;

interface Member {
  x: number;
  h: number;
  build: Build;
  outfit: Outfit;
  hair?: 'short' | 'long' | 'bun' | 'cap';
  facing: 1 | -1;
}

const LEFT: Member[] = [
  {x: 250, h: 430, build: 'adult', outfit: 'coat', facing: 1},
  {x: 395, h: 410, build: 'adult', outfit: 'dress', hair: 'long', facing: 1},
  {x: 520, h: 250, build: 'child', outfit: 'plain', facing: 1},
  {x: 665, h: 440, build: 'adult', outfit: 'plain', facing: 1},
];
const RIGHT: Member[] = [
  {x: 1255, h: 445, build: 'adult', outfit: 'hood', facing: -1},
  {x: 1400, h: 260, build: 'child', outfit: 'plain', hair: 'bun', facing: -1},
  {x: 1525, h: 420, build: 'elder', outfit: 'coat', hair: 'cap', facing: -1},
  {x: 1670, h: 440, build: 'adult', outfit: 'dress', hair: 'bun', facing: -1},
];

const DOWN: Pose = {...STAND, head: 22, turn: 0.6, lean: 3};
const LOOK: Pose = {...STAND, head: 2, turn: 1};
const REACH: Pose = {...STAND, lean: 8, head: 8, turn: 1, aF: [84, -4], aB: [-8, 14]};
const HOLD_LOW: Pose = {...STAND, head: 12, turn: 1, aF: [34, 4]};
const CHILD_UP: Pose = {...STAND, head: -8, turn: 1, aB: [-4, 8], aF: [-20, -12]};

// The fissure between the two groups (jagged, widening toward the viewer).
const GAP = (() => {
  const ys = [HORIZON, 740, 790, 840, 900, 960, 1030, 1110, 1250, 1400];
  const left = ys.map((y, i) => [960 - lerp(2, 300, Math.pow((y - HORIZON) / 700, 1.2)) - (rnd(`gap-l-${i}`) - 0.5) * 22, y]);
  const right = ys.map((y, i) => [960 + lerp(2, 300, Math.pow((y - HORIZON) / 700, 1.2)) + (rnd(`gap-r-${i}`) - 0.5) * 22, y]);
  return [...left, ...right.reverse()].map((p) => p.join(',')).join(' ');
})();

const RefrainStage: React.FC<{t: number}> = ({t}) => {
  const final = t >= CUES.gapFills[0];
  const fill = ramp(t, CUES.gapFills[0], CUES.gapFills[1], easeInOut);
  const spread = ramp(t, CUES.lightSpreads[0], CUES.lightSpreads[1], easeInOut);
  const connect = ramp(t, CUES.handsConnect[0], CUES.handsConnect[1], easeInOut);
  const warmth = clamp(fill * 0.5 + spread * 0.5);

  const camera = {
    scale: keys(t, [[18.25, 1.08], [19.95, 1.0], [21.42, 0.84]], easeInOut),
    cx: 960,
    cy: 640,
    y: keys(t, [[19.95, 0], [21.42, 30]], easeInOut),
  };

  // Left inner person: looks across on "the", steps forward in 08B.
  const look = ramp(t, CUES.lookAcross - 0.1, CUES.lookAcross + 0.3, easeOut);
  const stepL = ramp(t, CUES.leftSteps, CUES.leftSteps + 0.55, easeInOut);
  const stepR = ramp(t, CUES.rightResponds, CUES.rightResponds + 0.5, easeInOut);
  const posePerson = (side: 'L' | 'R', i: number): {x: number; pose: Pose} => {
    const m = side === 'L' ? LEFT[i] : RIGHT[i];
    const idle = {...DOWN, head: DOWN.head + Math.sin(t * 1.3 + i) * 2};
    if (side === 'L' && i === 3) {
      let p = lerpPose(idle, LOOK, look);
      p = lerpPose(walkPose(t * 1.6, stepL > 0 && stepL < 1 ? 0.8 : 0, p), REACH, ramp(t, CUES.leftSteps + 0.25, CUES.handsConnect[0], easeOut));
      return {x: lerp(m.x, 790, stepL), pose: p};
    }
    if (side === 'R' && i === 0) {
      let p = lerpPose(idle, LOOK, ramp(t, CUES.gapFills[0] + 0.1, CUES.rightResponds));
      p = lerpPose(walkPose(t * 1.6, stepR > 0 && stepR < 1 ? 0.8 : 0, p), REACH, ramp(t, CUES.rightResponds + 0.2, CUES.handsConnect[0] + 0.05, easeOut));
      return {x: lerp(m.x, 1130, stepR), pose: p};
    }
    // Others lift their heads as the light reaches them; adults reach for children.
    const lift = ramp(t, CUES.lightSpreads[0] + i * 0.06, CUES.lightSpreads[0] + 0.4 + i * 0.06);
    let p = lerpPose(idle, LOOK, lift);
    if (m.build === 'child') p = lerpPose(p, CHILD_UP, lift);
    if ((side === 'L' && i === 1) || (side === 'R' && i === 2)) p = lerpPose(p, HOLD_LOW, lift);
    return {x: m.x, pose: p};
  };

  const render = (side: 'L' | 'R') =>
    (side === 'L' ? LEFT : RIGHT).map((m, i) => {
      const {x, pose} = posePerson(side, i);
      return (
        <Character
          key={`${side}${i}`}
          x={x}
          y={GROUND}
          height={m.h}
          pose={pose}
          facing={m.facing}
          build={m.build}
          outfit={m.outfit}
          hair={m.hair}
          rim={{color: mixColor(palette.mist, side === 'L' ? palette.amber : palette.teal, warmth), dx: -3 * m.facing, dy: -2, opacity: 0.25 + 0.6 * warmth}}
        />
      );
    });

  const L3 = posePerson('L', 3);
  const R0 = posePerson('R', 0);
  const hL = handWorld({x: L3.x, y: GROUND, height: LEFT[3].h, pose: L3.pose, facing: 1});
  const hR = handWorld({x: R0.x, y: GROUND, height: RIGHT[0].h, pose: R0.pose, facing: -1});
  const mid = [(hL[0] + hR[0]) / 2, (hL[1] + hR[1]) / 2];

  // Secondary connections spreading to neighbours.
  const nb = (side: 'L' | 'R', i: number) => {
    const m = side === 'L' ? LEFT[i] : RIGHT[i];
    const {x, pose} = posePerson(side, i);
    return handWorld({x, y: GROUND, height: m.h, pose, facing: m.facing});
  };
  const links: [number[], number[], string][] = [
    [hL, nb('L', 2), palette.amber],
    [nb('L', 2), nb('L', 1), palette.amber],
    [hR, nb('R', 1), palette.teal],
    [nb('R', 1), nb('R', 2), palette.teal],
  ];

  // Question-mark dot: turns warm on "love?", then falls into the gap.
  const dotFall = ramp(t, CUES.gapFills[0] - 0.05, CUES.gapFills[0] + 0.35, easeInOut);
  const dotY = lerp(QM.y + 80 * QM.scale, HORIZON + 20, dotFall);
  const loveGlow = ramp(t, CUES.loveGlow, CUES.loveGlow + 0.3, easeOut);

  // Distant figures walking in from the edges (revealed by the pull-back).
  const edgeWalk = ramp(t, 20.3, 21.42, (x) => x);

  return (
    <SceneFrame
      background={palette.midnight}
      camera={camera}
      world={
        <>
          <defs>
            <linearGradient id="rf-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#05080D" />
              <stop offset="1" stopColor={mixColor(palette.deepBlue, palette.teal, 0.12 * warmth)} />
            </linearGradient>
            <linearGradient id="rf-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={mixColor(palette.asphalt, palette.deepBlue, 0.3)} />
              <stop offset="1" stopColor={palette.silhouette} />
            </linearGradient>
            <linearGradient id="rf-gapfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="0.25" stopColor={palette.guidance} stopOpacity="0.85" />
              <stop offset="1" stopColor={palette.amber} stopOpacity="0.35" />
            </linearGradient>
            <clipPath id="rf-gapclip">
              <rect x={0} y={HORIZON - 10} width={1920} height={lerp(0, 760, fill)} />
            </clipPath>
          </defs>
          <rect x={-500} y={-500} width={2920} height={HORIZON + 500} fill="url(#rf-sky)" />
          <Skyline
            seed={81}
            x0={-500}
            x1={2420}
            baseY={HORIZON + 4}
            minH={60}
            maxH={320}
            color={mixColor(palette.asphalt, palette.midnight, 0.35)}
            windowColor={palette.teal}
            litFraction={0.05 + 0.1 * warmth}
            windowOpacity={0.4}
            warmColor={palette.amber}
            warmFraction={0.5}
            t={t}
          />
          <rect x={-500} y={HORIZON} width={2920} height={900} fill="url(#rf-ground)" />
          {/* the divide */}
          <polygon points={GAP} fill={palette.silhouette} stroke={palette.graphite} strokeWidth={2} />
          {final && (
            <g clipPath="url(#rf-gapclip)">
              <polygon points={GAP} fill="url(#rf-gapfill)" opacity={0.9} />
              <polygon points={GAP} fill={palette.guidance} opacity={0.4} style={{filter: 'blur(30px)'}} />
            </g>
          )}
          <Glow x={960} y={HORIZON + 80} r={lerp(80, 760, fill)} ry={lerp(40, 200, fill)} color={palette.guidance} opacity={0.25 + 0.6 * fill} core={0.04} />
          {/* drifting warm particles between the groups */}
          <Particles t={t} seed={82} count={34} color={palette.amber} opacity={0.35 + 0.4 * warmth} area={{x: 700, y: 520, w: 520, h: 420}} size={[1, 3]} rise={14} drift={30} glow />
          {/* distant figures from the edges */}
          <g opacity={0.8 * ramp(t, 20.2, 20.6)}>
            <Character x={lerp(-260, -60, edgeWalk)} y={GROUND - 120} height={300} pose={walkPose(t * 1.5, 1)} facing={1} outfit="coat" rim={{color: palette.amber, dx: -2, dy: -2, opacity: 0.4 * warmth}} />
            <Character x={lerp(2180, 1980, edgeWalk)} y={GROUND - 120} height={290} pose={walkPose(t * 1.5 + 0.4, 1)} facing={-1} outfit="dress" hair="long" rim={{color: palette.teal, dx: 2, dy: -2, opacity: 0.4 * warmth}} />
          </g>
          {render('L')}
          {render('R')}
          {/* hands meeting over the gap */}
          {connect > 0 && (
            <>
              <LightLine d={`M${hL[0]},${hL[1]} Q${mid[0]},${mid[1] - 18} ${hR[0]},${hR[1]}`} length={Math.hypot(hR[0] - hL[0], hR[1] - hL[1]) + 10} progress={connect} color={palette.guidance} width={4} />
              <Glow x={mid[0]} y={mid[1]} r={60 + 50 * connect} color={palette.amber} opacity={connect} />
            </>
          )}
          {links.map(([a, b, col], i) => (
            <LightLine
              key={i}
              d={`M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2},${Math.min(a[1], b[1]) - 40} ${b[0]},${b[1]}`}
              length={Math.hypot(b[0] - a[0], b[1] - a[1]) + 40}
              progress={ramp(t, CUES.lightSpreads[0] + (i % 2) * 0.18, CUES.lightSpreads[0] + 0.3 + (i % 2) * 0.18, easeInOut)}
              color={col}
              width={2.5}
              opacity={0.85}
            />
          ))}
        </>
      }
      screen={
        <>
          <QuestionMark
            x={QM.x}
            y={QM.y}
            scale={QM.scale}
            progress={1}
            color={mixColor(mixColor(palette.sky, palette.ivory, 0.4), palette.guidance, loveGlow * 0.5)}
            dotColor={mixColor(palette.ivory, palette.amber, loveGlow)}
            dot={1 - dotFall}
            opacity={lerp(1, 0.3, ramp(t, CUES.gapFills[0], CUES.gapFills[1]))}
          />
          {dotFall > 0 && dotFall < 1 && <Glow x={QM.x} y={dotY} r={46} color={palette.amber} opacity={1} />}
        </>
      }
    />
  );
};

// One shared line for both refrains, so the dissolve never doubles the text.
// The parentheses (and a warmer glow) arrive with the second refrain.
const refrainLine = () => {
  const F = LYRICS.refrainFinal;
  return [
    {
      words: [{text: '(', start: F.start, emph: 'teal' as const, confidence: F.words[0].confidence}, ...LYRICS.refrainFirst.words, {text: ')', start: F.start, emph: 'teal' as const, confidence: F.words[0].confidence}],
      x: 960,
      y: 108,
      align: 'center' as const,
      size: typeScale.refrain,
    },
  ];
};

export const FirstRefrainScene: React.FC<{t: number}> = ({t}) => (
  <>
    <RefrainStage t={t} />
    <LyricBlock t={t} lines={refrainLine()} />
  </>
);

export const FinalRefrainScene: React.FC<{t: number}> = ({t}) => {
  const warm = ramp(t, LYRICS.refrainFinal.start, LYRICS.refrainFinal.start + 0.6, easeOut);
  return (
    <>
      <RefrainStage t={t} />
      <LyricBlock t={t} lines={refrainLine()} glow={warm > 0 ? `rgba(244,208,111,${(0.45 * warm).toFixed(3)})` : undefined} />
    </>
  );
};
