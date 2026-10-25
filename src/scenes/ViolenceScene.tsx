import React from 'react';
import {Character, handWorld, lerpPose, Pose, STAND, walkPose} from '../components/Character';
import {PerspectiveStreet, StreetView} from '../components/City';
import {Fog, Rain} from '../components/Atmosphere';
import {Glow, Ring} from '../components/Light';
import {LyricBlock} from '../components/LyricText';
import {SceneFrame} from '../components/SceneFrame';
import {CUES, LYRICS, SCENES} from '../data/lyricTiming';
import {palette} from '../data/palette';
import {clamp, easeIn, easeOut, easeSoft, keys, lerp, pulse, ramp} from '../utils/anim';

// SCENE 01 — "People killin' people dyin'"
// A night street. An aggressor steps out of the dark foreground; a figure
// under a streetlight raises their hands; a single flash; the figure falls out
// of the light. A crimson ripple spreads on the wet pavement.

const VIEW: StreetView = {vpX: 1000, vpY: 520, groundY: 520};
const RIPPLE = SCENES[1].transition as {x: number; y: number};

const AIM: Pose = {lean: -3, head: 4, turn: 1, aB: [-8, 14], aF: [88, -2], lB: [-10, 0], lF: [12, 0]};
const VICTIM_IDLE: Pose = {...STAND, head: 14, turn: 0.6, aF: [30, 70], aB: [-4, 10]};
const VICTIM_HANDS_UP: Pose = {lean: -8, head: -4, turn: 1, aB: [150, -30], aF: [160, -40], lB: [-10, 0], lF: [8, 0]};
const VICTIM_HIT: Pose = {lean: -20, head: -18, turn: 1, aB: [120, 10], aF: [110, 30], lB: [-14, 0], lF: [6, 0]};
const VICTIM_CLUTCH: Pose = {lean: 22, head: 30, turn: 0.8, aB: [20, 80], aF: [40, 110], lB: [-16, 6], lF: [18, -10]};
const VICTIM_LIMP: Pose = {lean: 4, head: -10, turn: 0.4, aB: [150, 10], aF: [120, 20], lB: [-6, -10], lF: [10, -18]};
const VICTIM_KNEEL: Pose = {lean: 30, head: 38, turn: 0.6, aB: [10, 40], aF: [36, 100], lB: [-4, -100], lF: [74, -140]};

export const ViolenceScene: React.FC<{t: number}> = ({t}) => {
  const shot = pulse(t, CUES.gunshot, 0.02, 0.14);

  // Camera: slow push down the street, then a dive toward the pavement ripple.
  const camera = {
    scale: keys(t, [[0, 1.0], [2.45, 1.13]], easeSoft),
    cx: 1120,
    cy: 720,
    x: Math.sin(t * 1.3) * 3,
  };

  // Victim's lamp falters at the shot and again as they fall.
  const flick = (a: number, b: number) => (t > a && t < b ? (Math.floor(t * 30) % 3 === 0 ? 0.35 : 0.9) : 1);
  const lampIntensity = (i: number) => {
    if (i === 2) return 1.05 * flick(1.03, 1.2) * flick(2.2, 2.3) * lerp(1, 0.65, ramp(t, 2.2, 2.6));
    return 0.7;
  };

  // ── Aggressor (foreground left) ──
  const aZ = 1.3;
  const aX = VIEW.vpX + keys(t, [[0, -1000], [CUES.aggressorStops, -600], [1.9, -600], [2.6, -760]], easeOut) / aZ;
  const aY = VIEW.vpY + VIEW.groundY / aZ;
  const aH = 570 / aZ;
  const walkAmt = 1 - ramp(t, 0.45, CUES.aggressorStops);
  let aPose = walkPose(t * 1.55, walkAmt, STAND);
  aPose = lerpPose(aPose, AIM, ramp(t, CUES.gunRaise[0], CUES.gunRaise[1], easeOut));
  aPose = {...aPose, aF: [aPose.aF[0] + 14 * shot, aPose.aF[1]], lean: aPose.lean - 4 * shot};
  aPose = lerpPose(aPose, {...STAND, head: 10, turn: 0.9, aF: [14, 10]}, ramp(t, 1.75, 2.4));
  const aOpacity = 1 - 0.9 * ramp(t, 2.0, 2.6);
  const aggressor = {x: aX, y: aY, height: aH, pose: aPose, facing: 1 as const};
  const muzzle = handWorld(aggressor);
  const muzzleX = muzzle[0] + aH * 0.07;

  // ── Victim (under the streetlight, mid-distance) ──
  const vZ = 2.35;
  const vXw = 650 + 60 * ramp(t, 0.82, 1.0) + 70 * ramp(t, 1.0, 1.6, easeOut);
  const vX = VIEW.vpX + vXw / vZ;
  const vY = VIEW.vpY + VIEW.groundY / vZ;
  const vH = 570 / vZ;
  let vPose = lerpPose(VICTIM_IDLE, VICTIM_HANDS_UP, ramp(t, 0.8, 0.98, easeOut));
  vPose = lerpPose(vPose, VICTIM_HIT, ramp(t, CUES.gunshot, CUES.gunshot + 0.12, easeOut));
  vPose = lerpPose(vPose, VICTIM_CLUTCH, ramp(t, 1.15, CUES.victimKneels));
  vPose = lerpPose(vPose, VICTIM_KNEEL, ramp(t, CUES.victimKneels, CUES.victimFalls[0]));
  const fall = ramp(t, CUES.victimFalls[0], CUES.victimFalls[1], easeIn);
  vPose = lerpPose(vPose, VICTIM_LIMP, ramp(t, CUES.victimFalls[0] + 0.1, CUES.victimFalls[1]));
  const vRot = 86 * fall - 4 * Math.sin(clamp((t - CUES.victimFalls[1]) / 0.25) * Math.PI) * (t > CUES.victimFalls[1] ? 1 : 0);
  const lamp = lampIntensity(2);

  // Crimson consequence on the pavement where the body lies.
  const restX = vX + vH * 0.42;
  const crimson = (start: number) => {
    const p = ramp(t, start, start + 0.9, easeOut);
    return <Ring x={restX} y={vY + 4} r={lerp(8, 230, p)} squash={0.22} color={palette.crimson} opacity={(1 - p) * 0.75 * (t > start ? 1 : 0)} width={3} />;
  };

  // Ripples that become the window in the next scene.
  const ripple = (start: number, k: number) => {
    const p = ramp(t, start, start + 0.8, easeOut);
    return <Ring key={start} x={RIPPLE.x} y={RIPPLE.y} r={lerp(6, 520, p)} squash={0.28} color={palette.sky} opacity={(1 - p) * 0.55 * k * (t > start ? 1 : 0)} width={2.5} />;
  };

  const L = LYRICS.violence;
  return (
    <SceneFrame
      background={palette.midnight}
      camera={camera}
      world={
        <>
          <PerspectiveStreet
            view={VIEW}
            t={t}
            lampColor={palette.lampCool}
            lampIntensity={lampIntensity}
            skyTop={palette.midnight}
            skyBottom={palette.deepBlue}
            buildingColor={palette.asphalt}
            windowColor={palette.sky}
            windowLit={0.08}
          />
          <Fog t={t} seed={3} count={9} color={palette.mist} opacity={0.07} y={560} spread={60} />
          {/* red reflection bleeding into the wet pavement */}
          <Glow x={restX} y={vY + 10} r={210} ry={46} color={palette.crimson} opacity={0.5 * ramp(t, 2.0, 2.6)} core={0.02} />
          {crimson(CUES.crimsonRipple)}
          {crimson(CUES.crimsonRipple + 0.3)}
          <Character
            x={vX}
            y={vY}
            height={vH}
            pose={vPose}
            facing={-1}
            outfit="plain"
            hair="cap"
            rotate={vRot}
            rim={{color: palette.lampCool, dx: 0, dy: -2.5, opacity: 0.55 * lamp}}
          />
          {/* the flash lights the street for an instant */}
          <rect x={-400} y={-400} width={2800} height={1900} fill={palette.amber} opacity={0.1 * shot} />
          <Character
            {...aggressor}
            outfit="coat"
            prop="gun"
            propOpacity={ramp(t, 0.4, 0.6)}
            opacity={aOpacity}
            rim={{color: palette.lampCool, dx: 3, dy: -1.5, opacity: 0.45}}
          />
          {shot > 0.02 && (
            <>
              <Glow x={muzzleX} y={muzzle[1] - 2} r={120 * shot + 30} color={palette.amber} opacity={shot} />
              {t < CUES.gunshot + 0.07 && (
                <polygon
                  points={`${muzzleX - 6},${muzzle[1] - 2} ${muzzleX + 40},${muzzle[1] - 6} ${muzzleX + 52},${muzzle[1] - 2} ${muzzleX + 40},${muzzle[1] + 3}`}
                  fill="#FFF6E0"
                />
              )}
            </>
          )}
        </>
      }
      screen={
        <>
          <Rain t={t} seed={11} count={140} color={palette.sky} opacity={0.22} length={38} angle={6} />
          {ripple(2.2, 0.8)}
          {ripple(2.38, 0.6)}
          {ripple(2.55, 0.4)}
        </>
      }
      overlay={
        <LyricBlock
          t={t}
          exitAt={2.55}
          lines={[
            {words: L.words.slice(0, 2), x: 960, y: 140, align: 'center'},
            {words: L.words.slice(2), x: 960, y: 246, align: 'center'},
          ]}
        />
      }
    />
  );
};
