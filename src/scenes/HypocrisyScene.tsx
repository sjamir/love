import React from 'react';
import {Character, lerpPose, Pose} from '../components/Character';
import {Particles} from '../components/Atmosphere';
import {Glow} from '../components/Light';
import {LyricBlock} from '../components/LyricText';
import {SceneFrame} from '../components/SceneFrame';
import {CUES, LYRICS, SCENES} from '../data/lyricTiming';
import {palette} from '../data/palette';
import {easeInOut, easeOut, keys, lerp, mixColor, ramp} from '../utils/anim';

// SCENE 03 — "Could you practice what you preach?"
// A confident speaker at a podium, under a spotlight born from the previous
// scene's glint. Their public gestures are open and generous; their shadow on
// the wall turns its back and pushes away the person reaching out from the
// edge of the light. The shadow falls across that outstretched hand.

const SLIT_X = (SCENES[2].transition as {x: number}).x;
const FLOOR = 905;
const SPEAKER = {x: 1040, h: 520};
const NEEDY = {x: 1650, h: 360};

const SHADOW_TRUE: Pose = {lean: -6, head: 14, turn: 0.9, aB: [-78, -6], aF: [40, 112], lB: [-6, 0], lF: [6, 0]};
const NEEDY_SIT: Pose = {seat: true, lean: 8, head: 16, turn: 0.8, aB: [10, 30], aF: [12, 24], lB: [118, -62], lF: [124, -66]};
const NEEDY_REACH: Pose = {...NEEDY_SIT, lean: 16, head: -6, aF: [96, -6]};
const NEEDY_DROP: Pose = {...NEEDY_SIT, lean: 4, head: 30, aF: [58, 24]};

export const HypocrisyScene: React.FC<{t: number}> = ({t}) => {
  const open = ramp(t, 5.15, 5.75, easeOut); // spotlight widens out of the slit
  const cool = ramp(t, CUES.lightCools, CUES.lightCools + 0.4);
  const spot = mixColor(palette.ivory, palette.sky, cool * 0.55);
  const spotI = lerp(1, 0.78, cool);

  const camera = {
    scale: keys(t, [[5.15, 1.0], [6.5, 1.03], [7.5, 1.14]], easeInOut),
    cx: 1330,
    cy: 560,
  };

  // Speaker: preaching gestures; glances at the person in need, then away.
  const g = Math.sin(t * 4.3);
  const preach = ramp(t, CUES.lightCools - 0.1, CUES.lightCools + 0.15, easeOut);
  const glance = Math.min(ramp(t, 6.45, 6.7), 1 - ramp(t, 6.95, 7.15));
  const away = ramp(t, CUES.speakerTurnsAway, CUES.speakerTurnsAway + 0.2);
  const speakerPose: Pose = {
    lean: 4 + g * 1.5,
    head: lerp(-2 + Math.sin(t * 3.1) * 4, -10, preach) + 6 * glance,
    turn: lerp(1, -0.9, glance) * (1 - away) + away * 1,
    aB: [lerp(-6, 30, preach), lerp(14, 40, preach)],
    aF: [lerp(84 + g * 22, 150, preach), lerp(38 - g * 18, -12, preach)],
    lB: [-4, 0],
    lF: [4, 0],
  };

  // Shadow: starts as an honest copy, diverges on "what you", grows on "preach".
  const diverge = ramp(t, 6.35, 7.0, easeInOut);
  const grow = ramp(t, CUES.shadowFalls[0], CUES.shadowFalls[1], easeInOut);
  const shadowPose = lerpPose(speakerPose, SHADOW_TRUE, diverge);
  const shadowH = SPEAKER.h * lerp(1.3, 1.85, grow);
  const shadowX = lerp(SPEAKER.x + 210, SPEAKER.x + 330, grow);

  // Person in need: reaches out, then drops their hand once the shadow covers it.
  let needyPose = lerpPose(NEEDY_SIT, NEEDY_REACH, ramp(t, CUES.reachOut, CUES.reachOut + 0.55, easeOut));
  needyPose = lerpPose(needyPose, NEEDY_DROP, ramp(t, 7.4, 7.9));
  const needyLit = 1 - grow;

  const L = LYRICS.hypocrisy;
  return (
    <SceneFrame
      background={palette.midnight}
      camera={camera}
      world={
        <>
          <defs>
            <linearGradient id="hy-wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={palette.midnight} />
              <stop offset="1" stopColor={palette.asphalt} />
            </linearGradient>
            <linearGradient id="hy-cone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={spot} stopOpacity="0.32" />
              <stop offset="1" stopColor={spot} stopOpacity="0.06" />
            </linearGradient>
          </defs>
          <rect x={-300} y={-300} width={2600} height={FLOOR + 300} fill="url(#hy-wall)" />
          <rect x={-300} y={FLOOR} width={2600} height={500} fill={palette.silhouette} />
          {/* pool of light on the wall + floor */}
          <Glow x={SLIT_X + 30} y={540} r={lerp(60, 520, open)} ry={lerp(500, 460, open)} color={spot} opacity={0.55 * spotI} core={0.05} />
          <Glow x={SLIT_X + 30} y={FLOOR + 6} r={lerp(40, 420, open)} ry={60} color={spot} opacity={0.6 * spotI} core={0.05} />
          {/* the speaker's shadow on the wall (drawn under the speaker) */}
          <g style={{filter: 'blur(5px)'}} opacity={0.82}>
            <Character x={shadowX} y={FLOOR - 30} height={shadowH} pose={shadowPose} facing={-1} color={palette.silhouette} />
          </g>
          {/* person in need, at the edge of the light */}
          <Character
            x={NEEDY.x}
            y={FLOOR}
            height={NEEDY.h}
            pose={needyPose}
            facing={-1}
            outfit="hood"
            rim={{color: spot, dx: -3, dy: -2, opacity: 0.25 + 0.4 * needyLit}}
          />
          {/* the shadow falling across them */}
          <polygon
            points={`${lerp(1500, 1380, grow)},${FLOOR - 520} ${lerp(1560, 1900, grow)},${FLOOR - 560} 2100,${FLOOR + 200} ${lerp(1500, 1300, grow)},${FLOOR + 200}`}
            fill={palette.silhouette}
            opacity={0.55 * grow}
            style={{filter: 'blur(30px)'}}
          />
          {/* speaker + podium */}
          <Character
            x={SPEAKER.x}
            y={FLOOR}
            height={SPEAKER.h}
            pose={speakerPose}
            facing={-1}
            outfit="plain"
            rim={{color: spot, dx: 3, dy: -3, opacity: 0.7 * open}}
          />
          <line x1={985} y1={712} x2={1000} y2={620} stroke={palette.silhouette} strokeWidth={6} />
          <ellipse cx={1001} cy={614} rx={8} ry={12} fill={palette.graphite} />
          <polygon points={`890,705 1130,705 1110,${FLOOR} 910,${FLOOR}`} fill={mixColor(palette.asphalt, palette.midnight, 0.3)} />
          <polygon points="890,705 1130,705 1126,724 894,724" fill={mixColor(palette.graphite, spot, 0.25 * open)} />
          <circle cx={1010} cy={800} r={30} fill="none" stroke={palette.graphite} strokeWidth={3} opacity={0.8} />
          {/* volumetric cone (on top, very light) */}
          <polygon
            points={`${SLIT_X - lerp(2, 30, open)},-60 ${SLIT_X + lerp(2, 30, open)},-60 ${SLIT_X + 30 + lerp(10, 380, open)},${FLOOR} ${SLIT_X + 30 - lerp(10, 380, open)},${FLOOR}`}
            fill="url(#hy-cone)"
            opacity={spotI}
          />
          <Particles t={t} seed={31} count={40} color={spot} opacity={0.5 * open} area={{x: SLIT_X - 260, y: 60, w: 600, h: 820}} size={[1, 2.6]} rise={10} />
        </>
      }
      overlay={
        <LyricBlock
          t={t}
          style="light"
          exitAt={7.48}
          lines={[
            {words: L.words.slice(0, 3), x: 140, y: 150},
            {words: L.words.slice(3), x: 140, y: 258},
          ]}
        />
      }
    />
  );
};
