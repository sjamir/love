import React from 'react';
import {Character, handWorld, lerpPose, Pose, STAND, walkPose} from '../components/Character';
import {PerspectiveStreet, project, STREET_LAMPS, StreetView} from '../components/City';
import {Particles} from '../components/Atmosphere';
import {Beam, Glow, LightLine} from '../components/Light';
import {LyricBlock} from '../components/LyricText';
import {SceneFrame} from '../components/SceneFrame';
import {CUES, HERO_WINDOW, LYRICS} from '../data/lyricTiming';
import {palette} from '../data/palette';
import {light} from '../data/visualConfig';
import {clamp, easeInOut, easeOut, keys, lerp, mixColor, ramp, rndRange} from '../utils/anim';

// SCENE 06 — "Send some guidance from above"
// The merged light from the clouds drops as one warm beam onto the same street
// where the film began. The broken row of streetlights comes back on, one after
// another, revealing someone sitting in the dark. A second person crosses the
// street toward them along a thin line of light. The light reaches the windows.

// Elevated view of the opening street.
const VIEW: StreetView = {vpX: 960, vpY: 300, groundY: 1000};
const OPENING = {x: 960, y: -510};
const LAND = {X: 0, z: 2.2};
const SEATED = {X: 930, z: 2.8};
const HELPER_FROM = {X: -900, z: 2.5};
const HELPER_TO = {X: 700, z: 2.75};

const SIT: Pose = {seat: true, lean: 14, head: 30, turn: 0.6, aB: [20, 40], aF: [30, 50], lB: [118, -62], lF: [124, -66]};
const SIT_LOOK: Pose = {...SIT, head: 0, lean: 4, turn: -0.8};
const REACH: Pose = {...STAND, lean: 10, head: 18, turn: 1, aF: [82, -6], aB: [-4, 12]};

export const GuidanceScene: React.FC<{t: number}> = ({t}) => {
  const tilt = keys(t, [[12.85, 700], [13.8, 0]], easeInOut);
  const camera = {y: tilt};

  const beamP = ramp(t, 12.95, CUES.beamLands, easeInOut);
  const [landX, landY] = project(VIEW, LAND.X, VIEW.groundY, LAND.z);
  const beamEndY = lerp(OPENING.y, landY, beamP);
  const landed = ramp(t, CUES.beamLands - 0.05, CUES.beamLands + 0.3, easeOut);

  // Streetlights come back one by one, outward from where the beam landed.
  const order = STREET_LAMPS.map((l, i) => ({i, d: Math.abs(l.z - LAND.z)}))
    .sort((a, b) => a.d - b.d)
    .map((o) => o.i);
  const lampIntensity = (i: number) => ramp(t, CUES.lampsStart + order.indexOf(i) * CUES.lampStep, CUES.lampsStart + order.indexOf(i) * CUES.lampStep + 0.3, easeOut) * 0.95;

  const roofGlow = ramp(t, 13.2, 13.7) * (1 - 0.5 * ramp(t, 14.4, 15.1));
  const windowGlow = (side: -1 | 1, z: number, row: number) => {
    const start = CUES.windowsLight[0] + (z - 1) * 0.07 + row * 0.02 + (side === -1 ? 0.12 : 0);
    return ramp(t, start, start + 0.25) * (side === 1 ? 0.62 : 0.4) * (rndRange(`gw-${side}-${z.toFixed(2)}-${row}`, 0, 1) < 0.7 ? 1 : 0.3);
  };

  // Seated person, revealed by the nearest returning streetlight.
  const [sx, sy] = project(VIEW, SEATED.X, VIEW.groundY, SEATED.z);
  const sH = 570 / SEATED.z;
  const seenBy = clamp(lampIntensity(2) * 1.2);
  const seatedPose = lerpPose(SIT, SIT_LOOK, ramp(t, 14.9, 15.3));

  // Helper crosses the road toward them.
  const hp = ramp(t, CUES.helperWalks[0], CUES.helperWalks[1], (x) => x);
  const hX = lerp(HELPER_FROM.X, HELPER_TO.X, easeInOut(hp));
  const hz = lerp(HELPER_FROM.z, HELPER_TO.z, hp);
  const [hx, hy] = project(VIEW, hX, VIEW.groundY, hz);
  const hH = 570 / hz;
  const hPose = lerpPose(walkPose(t * 1.6, hp > 0 && hp < 1 ? 1 : 0.2), REACH, ramp(t, CUES.helperWalks[1] - 0.25, CUES.helperWalks[1] + 0.1));

  // Light path along the ground: helper ← landing point → seated person.
  const pathPts = [
    project(VIEW, HELPER_FROM.X, VIEW.groundY, HELPER_FROM.z),
    project(VIEW, -400, VIEW.groundY, 2.3),
    [landX, landY] as [number, number],
    project(VIEW, 420, VIEW.groundY, 2.55),
    [sx, sy] as [number, number],
  ];
  const pathD = `M${pathPts.map((p) => p.join(',')).join(' L')}`;
  const pathLen = pathPts.slice(1).reduce((acc, p, i) => acc + Math.hypot(p[0] - pathPts[i][0], p[1] - pathPts[i][1]), 0);
  const pathP = ramp(t, CUES.beamLands + 0.1, 14.7, easeInOut);

  // Hero window (the camera flies into it for the next scene).
  const zNear = 1150 / (HERO_WINDOW.x + HERO_WINDOW.w - 960);
  const zFar = 1150 / (HERO_WINDOW.x - 960);
  const yTop = (HERO_WINDOW.y - VIEW.vpY) * zNear;
  const yBot = (HERO_WINDOW.y + HERO_WINDOW.h - VIEW.vpY) * zNear;
  const heroQuad = [project(VIEW, 1150, yTop, zFar), project(VIEW, 1150, yBot, zFar), project(VIEW, 1150, yBot, zNear), project(VIEW, 1150, yTop, zNear)];
  const heroGlow = ramp(t, CUES.windowsLight[0] + 0.1, CUES.windowsLight[1], easeOut);

  // Clouds above the street, where the beam comes from.
  const clouds = Array.from({length: 14}).map((_, i) => ({
    x: ((rndRange(`gc-x-${i}`, -300, 2200) + t * 10) % 2500) - 300,
    y: rndRange(`gc-y-${i}`, -900, -300),
    rx: rndRange(`gc-r-${i}`, 280, 520),
  }));

  const L = LYRICS.guidance;
  return (
    <SceneFrame
      background={palette.midnight}
      camera={camera}
      world={
        <>
          <PerspectiveStreet
            view={VIEW}
            t={t}
            lampColor={palette.guidance}
            lampIntensity={lampIntensity}
            skyTop="#05080D"
            skyBottom={mixColor(palette.deepBlue, palette.guidance, 0.08 * landed)}
            buildingColor={palette.asphalt}
            windowColor={palette.sky}
            windowLit={0.06}
            windowGlow={windowGlow}
            windowGlowColor={palette.guidance}
            roofGlow={roofGlow}
            wet={0.8}
          />
          <g style={{filter: 'blur(24px)'}}>
            {clouds.map((c, i) => (
              <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx} ry={c.rx * 0.3} fill={mixColor(palette.mist, palette.guidance, 0.3)} opacity={0.18} />
            ))}
          </g>
          <Glow x={OPENING.x} y={OPENING.y} r={520} ry={260} color={palette.guidance} opacity={0.9 - 0.4 * landed} core={0.06} />
          <polygon points={heroQuad.map((p) => p.join(',')).join(' ')} fill={mixColor(palette.graphite, palette.guidance, heroGlow)} opacity={0.15 + 0.85 * heroGlow} />
          <Beam x1={OPENING.x} y1={OPENING.y} x2={landX} y2={beamEndY} w1={light.beamWidthTop} w2={light.beamWidthBottom} color={palette.guidance} opacity={0.85 - 0.35 * ramp(t, 14.2, 15.2)} blur={8} />
          <Glow x={landX} y={landY} r={420} ry={110} color={palette.guidance} opacity={landed * 0.75} core={0.04} />
          <LightLine d={pathD} length={pathLen} progress={pathP} color={palette.guidance} width={4} opacity={0.85} />
          <Character
            x={sx}
            y={sy}
            height={sH}
            pose={seatedPose}
            facing={-1}
            outfit="hood"
            color={mixColor(palette.silhouette, palette.asphalt, 0.2)}
            rim={{color: palette.guidance, dx: 0, dy: -2, opacity: 0.15 + 0.75 * seenBy}}
          />
          <Glow x={sx} y={sy} r={160} ry={36} color={palette.guidance} opacity={0.5 * seenBy} core={0.03} />
          <Character x={hx} y={hy} height={hH} pose={hPose} facing={1} outfit="coat" opacity={ramp(t, CUES.helperWalks[0] - 0.4, CUES.helperWalks[0])} rim={{color: palette.guidance, dx: 2, dy: -2, opacity: 0.7}} />
          {t > CUES.helperWalks[1] - 0.1 && (
            <Glow
              x={handWorld({x: hx, y: hy, height: hH, pose: hPose, facing: 1})[0]}
              y={handWorld({x: hx, y: hy, height: hH, pose: hPose, facing: 1})[1]}
              r={40}
              color={palette.amber}
              opacity={ramp(t, CUES.helperWalks[1] - 0.1, CUES.helperWalks[1] + 0.2)}
            />
          )}
          <Particles t={t} seed={61} count={50} color={palette.guidance} opacity={0.5} area={{x: 700, y: -500, w: 520, h: 1300}} size={[1, 3]} rise={-40} glow />
        </>
      }
      overlay={
        <LyricBlock
          t={t}
          exitAt={15.12}
          glow="rgba(244,208,111,0.25)"
          lines={[
            {words: L.words.slice(0, 3), x: 140, y: 150},
            {words: L.words.slice(3), x: 140, y: 258},
          ]}
        />
      }
    />
  );
};
