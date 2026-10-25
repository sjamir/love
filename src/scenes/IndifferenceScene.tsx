import React from 'react';
import {Character, lerpPose, Pose, STAND, walkPose} from '../components/Character';
import {Skyline} from '../components/City';
import {Fog} from '../components/Atmosphere';
import {Glow} from '../components/Light';
import {LyricBlock} from '../components/LyricText';
import {SceneFrame} from '../components/SceneFrame';
import {CUES, LYRICS} from '../data/lyricTiming';
import {palette} from '../data/palette';
import {easeInOut, easeOut, keys, lerp, mixColor, ramp, rnd} from '../utils/anim';

// SCENE 04 — "Would you turn the other cheek?"
// A side-on street at night, desaturated. Someone sits against the wall with a
// cup. Pedestrians pass. One slows, stops, looks down at them… then turns their
// head away and walks on. Their long shadow slides across the space between
// them. The person left behind looks up — toward the next scene's sky.

const WALL_BOTTOM = 840;
const CURB = 950;
const LIGHT = {x: 1240, y: 200};
const NEEDY = {x: 600, y: 872, h: 400};

const NEEDY_SIT: Pose = {seat: true, lean: 10, head: 26, turn: 0.7, aB: [16, 30], aF: [62, -18], lB: [118, -62], lF: [124, -66]};
const NEEDY_HOPE: Pose = {...NEEDY_SIT, head: -6, lean: 14, aF: [80, -24]};
const NEEDY_SKY: Pose = {...NEEDY_SIT, head: -42, lean: -2, turn: 0.6};

const LOOK_DOWN: Pose = {...STAND, head: 26, turn: 1, lean: 3, aF: [10, 14], aB: [-6, 14]};

/** Long shadow cast on the pavement by a figure, away from the street light. */
const CastShadow: React.FC<{x: number; y: number; height: number; pose: Pose; facing: 1 | -1; opacity?: number; outfit?: 'coat' | 'plain'}> = ({
  x,
  y,
  height,
  pose,
  facing,
  opacity = 0.6,
  outfit = 'plain',
}) => {
  const k = Math.max(0.4, Math.min(3, (LIGHT.x - x) / 380));
  return (
    <g transform={`translate(${x},${y}) matrix(1,0,${k},-0.11,0,0) translate(${-x},${-y})`} opacity={opacity} style={{filter: 'blur(3px)'}}>
      <Character x={x} y={y} height={height} pose={pose} facing={facing} color="#000000" outfit={outfit} />
    </g>
  );
};

export const IndifferenceScene: React.FC<{t: number}> = ({t}) => {
  const camera = {
    scale: keys(t, [[7.5, 1.0], [8.45, 1.0], [9.05, 1.3], [10.0, 1.22]], easeInOut),
    cx: 720,
    cy: 640,
  };

  // Main pedestrian.
  const stopT = CUES.passerbyStops;
  const walkOn = CUES.walksOn;
  const px = keys(
    t,
    [
      [7.45, 1950],
      [8.1, 1150],
      [stopT, 830],
      [walkOn, 830],
      [10.6, -140],
    ],
    (x) => x,
  );
  const decel = ramp(t, 8.0, stopT, easeOut);
  const moving = t < stopT ? 1 - decel * 0.85 : ramp(t, walkOn, walkOn + 0.3);
  let pPose = walkPose(t * 1.7, moving, STAND);
  pPose = lerpPose(pPose, LOOK_DOWN, ramp(t, CUES.recognition[0], CUES.recognition[0] + 0.35) * (1 - ramp(t, walkOn, walkOn + 0.3)));
  const away = ramp(t, CUES.headTurnsAway[0], CUES.headTurnsAway[1], easeInOut);
  pPose = {
    ...pPose,
    turn: lerp(pPose.turn, -0.85, away),
    head: lerp(pPose.head, -8, away),
  };
  const P = {x: px, y: 900, h: 470};

  // Person in need: hope → disappointment → looks up.
  let nPose = lerpPose(NEEDY_SIT, NEEDY_HOPE, ramp(t, 8.6, 8.95));
  nPose = lerpPose(nPose, NEEDY_SIT, ramp(t, 9.25, 9.6));
  nPose = lerpPose(nPose, NEEDY_SKY, ramp(t, CUES.lookUp, CUES.lookUp + 0.45, easeInOut));

  // Background walkers on the far side of the pavement.
  const walkers = Array.from({length: 6}).map((_, i) => {
    const dir = rnd(`iw-d-${i}`) < 0.5 ? 1 : -1;
    const speed = 160 + rnd(`iw-s-${i}`) * 80;
    const span = 2600;
    const x = ((((rnd(`iw-x-${i}`) * span + dir * speed * t) % span) + span) % span) - 340;
    return {x, dir: dir as 1 | -1, h: 290 + rnd(`iw-h-${i}`) * 50, phase: rnd(`iw-p-${i}`), outfit: (i % 3 === 0 ? 'coat' : i % 3 === 1 ? 'dress' : 'plain') as 'coat' | 'dress' | 'plain'};
  });

  // A blurred foreground passer-by gives depth early in the scene.
  const fgX = keys(t, [[7.85, -500], [8.55, 2400]], (x) => x);

  const L = LYRICS.indifference;
  return (
    <SceneFrame
      background={palette.midnight}
      camera={camera}
      world={
        <>
          <defs>
            <linearGradient id="in-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={palette.midnight} />
              <stop offset="1" stopColor={mixColor(palette.nightBlue, palette.graphite, 0.3)} />
            </linearGradient>
            <linearGradient id="in-cone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={palette.ivory} stopOpacity="0.2" />
              <stop offset="1" stopColor={palette.ivory} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <rect x={-400} y={-400} width={2800} height={800} fill="url(#in-sky)" />
          <g style={{filter: 'blur(2px)'}}>
            <Skyline seed={41} x0={-400} x1={2400} baseY={300} minH={60} maxH={230} color={mixColor(palette.asphalt, palette.graphite, 0.3)} windowColor={palette.mist} litFraction={0.08} windowOpacity={0.3} t={t} />
          </g>
          {/* building wall with shopfronts */}
          <rect x={-400} y={260} width={2800} height={WALL_BOTTOM - 260} fill={mixColor(palette.asphalt, palette.midnight, 0.35)} />
          {[-260, 140, 900, 1700].map((x, i) => (
            <g key={i}>
              <rect x={x} y={470} width={340} height={300} fill={mixColor(palette.graphite, palette.midnight, 0.5)} />
              <rect x={x + 8} y={478} width={324} height={284} fill="none" stroke={palette.silhouette} strokeWidth={10} />
              <line x1={x + 170} y1={478} x2={x + 170} y2={762} stroke={palette.silhouette} strokeWidth={8} />
              <polygon points={`${x + 30},478 ${x + 90},478 ${x + 40},762 ${x - 20},762`} fill={palette.mist} opacity={0.05} />
            </g>
          ))}
          {[260, 330, 400].map((y) => (
            <line key={y} x1={-400} y1={y} x2={2400} y2={y} stroke={palette.silhouette} strokeWidth={3} opacity={0.4} />
          ))}
          {/* pavement + road */}
          <rect x={-400} y={WALL_BOTTOM} width={2800} height={CURB - WALL_BOTTOM} fill={mixColor(palette.asphalt, palette.graphite, 0.45)} />
          <rect x={-400} y={CURB} width={2800} height={400} fill={palette.silhouette} />
          <rect x={-400} y={CURB} width={2800} height={8} fill={palette.graphite} />
          {Array.from({length: 7}).map((_, i) => (
            <rect key={i} x={1180 + i * 70} y={CURB + 30} width={38} height={300} fill={palette.mist} opacity={0.12} />
          ))}
          {/* street light: hard, cold, unsentimental */}
          <polygon points={`${LIGHT.x - 20},${LIGHT.y} ${LIGHT.x + 20},${LIGHT.y} ${LIGHT.x + 420},${CURB} ${LIGHT.x - 420},${CURB}`} fill="url(#in-cone)" />
          <Glow x={LIGHT.x - 120} y={(WALL_BOTTOM + CURB) / 2} r={820} ry={80} color={palette.ivory} opacity={0.55} core={0.05} />
          <Glow x={LIGHT.x - 200} y={560} r={700} ry={360} color={palette.mist} opacity={0.12} core={0.02} />
          {/* far walkers */}
          <g opacity={0.55} style={{filter: 'blur(1.5px)'}}>
            {walkers.map((w, i) => (
              <Character key={i} x={w.x} y={846} height={w.h} pose={walkPose(t * 1.4 + w.phase, 1)} facing={w.dir} color={mixColor(palette.asphalt, palette.silhouette, 0.4)} outfit={w.outfit} hair={w.outfit === 'dress' ? 'long' : 'short'} />
            ))}
          </g>
          {/* person in need */}
          <rect x={NEEDY.x + 70} y={NEEDY.y - 8} width={60} height={8} fill={palette.graphite} opacity={0.6} />
          <Character x={NEEDY.x} y={NEEDY.y} height={NEEDY.h} pose={nPose} facing={1} outfit="hood" prop="cup" rim={{color: palette.mist, dx: 2.5, dy: -2, opacity: 0.35}} />
          {/* the passer-by and the shadow that passes between them */}
          <CastShadow x={P.x} y={P.y} height={P.h} pose={pPose} facing={-1} outfit="coat" opacity={0.85} />
          <Character x={P.x} y={P.y} height={P.h} pose={pPose} facing={-1} outfit="coat" hair="short" rim={{color: palette.ivory, dx: 3, dy: -2, opacity: 0.4}} />
          <Fog t={t} seed={42} count={6} color={palette.mist} opacity={0.06} y={700} spread={150} />
          {/* blurred foreground passer-by */}
          <Character x={fgX} y={1760} height={1500} pose={walkPose(t * 1.1, 0.6)} facing={1} color="#000000" outfit="coat" blur={14} opacity={0.92} />
        </>
      }
      overlay={
        <LyricBlock
          t={t}
          exitAt={9.95}
          lines={[
            {words: L.words.slice(0, 3), x: 1120, y: 150},
            {words: L.words.slice(3), x: 1120, y: 258},
          ]}
        />
      }
    />
  );
};
