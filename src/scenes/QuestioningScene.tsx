import React from 'react';
import {Character, Pose, STAND} from '../components/Character';
import {Particles} from '../components/Atmosphere';
import {Glow, QuestionMark} from '../components/Light';
import {LyricBlock} from '../components/LyricText';
import {SceneFrame} from '../components/SceneFrame';
import {CUES, LYRICS} from '../data/lyricTiming';
import {palette} from '../data/palette';
import {easeInOut, easeOut, keys, lerp, mixColor, ramp, rnd, rndRange, wobble} from '../utils/anim';

// SCENE 07 — "'Cause people got me, got me questioning"
// One person alone in front of a wall of glass. With each "got me" another
// reflection of them appears, facing a different way. On "questioning" the
// reflections drift out of step, a curve of reflected light draws a question
// mark above them, and the reflections break up into particles.

export const QM = {x: 960, y: 430, scale: 1.0};
const GROUND = 960;
const CHAR = {x: 960, h: 410};

interface Pane {
  x0: number;
  x1: number;
  appear: number;
  rx: number; // reflection x
  facing: 1 | -1;
  scale: number;
  rot: number;
  lag: number;
}

const PANES: Pane[] = [
  {x0: 340, x1: 720, appear: CUES.reflection1, rx: 540, facing: -1, scale: 1.0, rot: -2, lag: 0.12},
  {x0: 1200, x1: 1580, appear: CUES.reflection2, rx: 1390, facing: 1, scale: 1.0, rot: 2, lag: 0.2},
  {x0: 60, x1: 300, appear: CUES.misalign, rx: 185, facing: 1, scale: 0.82, rot: -5, lag: 0.3},
  {x0: 1620, x1: 1860, appear: CUES.misalign + 0.15, rx: 1735, facing: -1, scale: 0.85, rot: 6, lag: 0.38},
];

const poseAt = (t: number): Pose => {
  const g1 = ramp(t, CUES.reflection1 - 0.05, CUES.reflection1 + 0.2, easeOut);
  const g2 = ramp(t, CUES.reflection2 - 0.05, CUES.reflection2 + 0.2, easeOut);
  const q = ramp(t, CUES.misalign, CUES.misalign + 0.4, easeInOut);
  const face = ramp(t, CUES.fragment[0], CUES.fragment[0] + 0.4, easeInOut);
  // head turns left on the first "got me", right on the second.
  let turn = lerp(0.3, -1, g1);
  turn = lerp(turn, 1, g2);
  turn = lerp(turn, 0, face);
  const bob = 5 * (Math.exp(-Math.max(0, t - CUES.reflection1) * 6) * (t > CUES.reflection1 ? 1 : 0) + Math.exp(-Math.max(0, t - CUES.reflection2) * 6) * (t > CUES.reflection2 ? 1 : 0));
  return {
    ...STAND,
    lean: lerp(4, -2, q),
    head: lerp(lerp(22, 8, g1), -6, face) + bob,
    turn,
    aB: [lerp(-6, 22, q), lerp(10, 78, q)],
    aF: [lerp(6, 26, q), lerp(10, 74, q)],
  };
};

export const QuestioningScene: React.FC<{t: number}> = ({t}) => {
  const camera = {
    x: keys(t, [[15.12, 50], [18.5, -50]], (x) => x),
    scale: keys(t, [[15.12, 1.0], [18.5, 1.08]], easeInOut),
    cx: 960,
    cy: 600,
  };
  const pose = poseAt(t);
  const mis = ramp(t, CUES.misalign, CUES.misalign + 0.5, easeInOut);
  const frag = ramp(t, CUES.fragment[0], CUES.fragment[1], easeInOut);
  const qmP = ramp(t, CUES.questionMarkDraw[0], CUES.questionMarkDraw[1], easeInOut);
  const dark = ramp(t, CUES.fragment[0], CUES.fragment[1] + 0.1);
  const fgX = keys(t, [[15.9, 2200], [17.8, -300]], (x) => x);

  const L = LYRICS.questioning;
  return (
    <SceneFrame
      background={palette.midnight}
      camera={camera}
      world={
        <>
          <defs>
            <linearGradient id="qu-glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={palette.deepBlue} />
              <stop offset="0.5" stopColor={palette.nightBlue} />
              <stop offset="1" stopColor={palette.midnight} />
            </linearGradient>
            <linearGradient id="qu-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={mixColor(palette.asphalt, palette.deepBlue, 0.4)} />
              <stop offset="1" stopColor={palette.silhouette} />
            </linearGradient>
            {PANES.map((p, i) => (
              <clipPath key={i} id={`qu-pane-${i}`}>
                <rect x={p.x0} y={110} width={p.x1 - p.x0} height={GROUND - 120} />
              </clipPath>
            ))}
          </defs>
          <rect x={-300} y={-300} width={2520} height={GROUND + 300} fill={palette.midnight} />
          {/* glass panes with reflections */}
          {PANES.map((p, i) => {
            const shown = ramp(t, p.appear - 0.1, p.appear + 0.3, easeOut) * (1 - frag);
            const rp = poseAt(t - p.lag * (0.3 + mis));
            const dx = mis * 34 * wobble(t, i + 1, 1.2);
            const rot = p.rot * (0.4 + mis);
            const warm = i === 1 ? Math.exp(-Math.pow((t - CUES.reflection2 - 0.3) / 0.35, 2)) : 0;
            return (
              <g key={i}>
                <rect x={p.x0} y={110} width={p.x1 - p.x0} height={GROUND - 120} fill="url(#qu-glass)" />
                <g clipPath={`url(#qu-pane-${i})`}>
                  {/* streaks of reflected light */}
                  <polygon points={`${p.x0 + 40},110 ${p.x0 + 120},110 ${p.x0 + 20},${GROUND} ${p.x0 - 60},${GROUND}`} fill={palette.sky} opacity={0.07} />
                  <polygon points={`${p.x1 - 90},110 ${p.x1 - 60},110 ${p.x1 - 150},${GROUND} ${p.x1 - 180},${GROUND}`} fill={warm > 0.01 ? palette.amber : palette.sky} opacity={0.05 + warm * 0.25} />
                  <g opacity={shown * 0.5} style={{filter: 'blur(1.2px)'}} transform={`translate(${p.rx + dx},${GROUND - 20}) rotate(${rot}) scale(${p.scale}) translate(${-p.rx},${-GROUND + 20})`}>
                    <Character x={p.rx} y={GROUND - 20} height={CHAR.h} pose={rp} facing={p.facing} color={mixColor(palette.sky, palette.deepBlue, 0.55)} rim={{color: palette.ivory, dx: -2 * p.facing, dy: -2, opacity: 0.5}} />
                  </g>
                </g>
                <rect x={p.x0} y={110} width={p.x1 - p.x0} height={GROUND - 120} fill="none" stroke={palette.graphite} strokeWidth={8} />
              </g>
            );
          })}
          {/* dark doorway behind the character */}
          <rect x={760} y={110} width={400} height={GROUND - 120} fill={palette.silhouette} />
          <Glow x={960} y={300} r={260} color={palette.sky} opacity={0.12} core={0.03} />
          {/* fragments: the reflections breaking into particles */}
          {frag > 0 &&
            PANES.map((p, i) => (
              <g key={i} opacity={(1 - ramp(t, CUES.fragment[1] - 0.1, CUES.fragment[1] + 0.3)) * Math.min(1, frag * 4)}>
                {Array.from({length: 40}).map((_, k) => {
                  const sx = p.rx + rndRange(`qf-x-${i}-${k}`, -90, 90) * p.scale;
                  const sy = GROUND - 20 - rnd(`qf-y-${i}-${k}`) * CHAR.h * p.scale;
                  const dx = (QM.x - sx) * frag * 0.5 + rndRange(`qf-dx-${i}-${k}`, -60, 60) * frag;
                  const dy = (QM.y - sy) * frag * 0.5 - 80 * frag;
                  const s = rndRange(`qf-s-${i}-${k}`, 2, 6);
                  return <rect key={k} x={sx + dx} y={sy + dy} width={s} height={s} fill={palette.sky} opacity={0.7} transform={`rotate(${frag * 90 * rnd(`qf-r-${i}-${k}`)},${sx + dx},${sy + dy})`} />;
                })}
              </g>
            ))}
          {/* wet ground + puddle reflection */}
          <rect x={-300} y={GROUND} width={2520} height={500} fill="url(#qu-ground)" />
          <g transform={`translate(0,${GROUND * 2}) scale(1,-1)`} opacity={0.22} style={{filter: 'blur(2.5px)'}}>
            <g transform={`skewX(${Math.sin(t * 3) * 2})`}>
              <Character x={CHAR.x} y={GROUND} height={CHAR.h} pose={pose} facing={1} color={palette.sky} />
            </g>
          </g>
          {/* the character */}
          <Character x={CHAR.x} y={GROUND} height={CHAR.h} pose={pose} facing={1} outfit="plain" rim={{color: palette.sky, dx: 2.5, dy: -2.5, opacity: 0.6}} />
          <rect x={-300} y={-300} width={2520} height={1700} fill="#000" opacity={0.55 * dark} />
          <Particles t={t} seed={71} count={30} color={palette.sky} opacity={0.3} area={{x: 0, y: 100, w: 1920, h: 860}} size={[1, 2.2]} rise={8} />
          {/* a glass mullion passing close to the lens */}
          <rect x={fgX} y={-300} width={70} height={1700} fill="#000" opacity={0.85} style={{filter: 'blur(10px)'}} />
        </>
      }
      screen={
        // Screen space, so it lines up exactly with the refrain's question mark.
        <QuestionMark x={QM.x} y={QM.y} scale={QM.scale} progress={qmP} color={mixColor(palette.sky, palette.ivory, 0.4)} dotColor={palette.ivory} dot={ramp(t, CUES.questionMarkDraw[1] - 0.1, CUES.questionMarkDraw[1] + 0.2, easeOut)} />
      }
      overlay={
        <LyricBlock
          t={t}
          exitAt={18.25}
          lines={[
            {words: L.words.slice(0, 4), x: 140, y: 130, size: 84},
            {words: L.words.slice(4, 6), x: 1240, y: 230, size: 84},
            {words: L.words.slice(6), x: 1240, y: 330, charReveal: true, size: 84},
          ]}
        />
      }
    />
  );
};
