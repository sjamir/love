import React from 'react';
import {Character, Pose} from '../components/Character';
import {Skyline} from '../components/City';
import {Particles, Rain} from '../components/Atmosphere';
import {Glow} from '../components/Light';
import {LyricBlock} from '../components/LyricText';
import {SceneFrame} from '../components/SceneFrame';
import {CUES, LYRICS} from '../data/lyricTiming';
import {palette} from '../data/palette';
import {easeInOut, easeOut, keys, lerp, mixColor, ramp, rnd, rndRange, window4} from '../utils/anim';

// SCENE 02 — "Children hurtin', I hear them cryin'"
// A small child sits alone in a dim room beside a rain-streaked window. Outside,
// two adult silhouettes argue in a lit window across the street. A passing
// headlight briefly finds the child and a fallen toy, then leaves them in the
// cold again. The glint on the glass becomes the next scene's spotlight.

const WIN = {x: 1000, y: 130, w: 700, h: 640};


const ARGUE_A: Pose = {lean: 6, head: -4, turn: 1, aB: [-10, 20], aF: [100, -20], lB: [-4, 0], lF: [6, 0]};
const ARGUE_B: Pose = {lean: -4, head: 6, turn: 1, aB: [20, 90], aF: [30, 100], lB: [-4, 0], lF: [4, 0]};

/**
 * A small child sitting on the floor hugging their knees (hand-drawn outline,
 * facing right). `ears` 0→1 moves the hands up to cover the ears; `sob` is a
 * small shoulder shake in degrees.
 */
const ChildHuddle: React.FC<{x: number; y: number; scale: number; ears: number; sob: number; breathe: number; rimColor: string; rimOpacity: number}> = ({
  x,
  y,
  scale,
  ears,
  sob,
  breathe,
  rimColor,
  rimOpacity,
}) => {
  const L = (a: number, b: number) => lerp(a, b, ears);
  // Head rests forward on the knees; drops a little lower when covering ears.
  const head = {x: L(60, 54), y: L(-214, -204)};
  const body =
    'M-55,0 C-84,-52 -80,-140 -46,-178 C-32,-194 -6,-197 10,-187 L70,-174 C100,-178 122,-160 118,-132 L124,-10 L158,-8 L158,0 Z';
  const hand = {x: L(114, head.x - 10), y: L(-150, head.y + 2)};
  const arm = `M-2,-170 Q${L(70, 34)},${L(-138, -232)} ${hand.x},${hand.y}`;
  const shape = (fill: string) => (
    <g fill={fill}>
      <path d={body} />
      <circle cx={head.x} cy={head.y} r={44} />
      <ellipse cx={head.x - 46} cy={head.y - 8} rx={15} ry={10} transform={`rotate(-20,${head.x - 46},${head.y - 8})`} />
      <path d={arm} fill="none" stroke={fill} strokeWidth={26} strokeLinecap="round" />
      <circle cx={hand.x} cy={hand.y} r={15} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${scale},${scale * (1 + breathe * 0.006)}) rotate(${sob},-40,0)`}>
      <g transform="translate(4,-3)" opacity={rimOpacity}>
        {shape(rimColor)}
      </g>
      {shape(palette.silhouette)}
    </g>
  );
};

export const ChildrenScene: React.FC<{t: number}> = ({t}) => {
  const camera = {scale: keys(t, [[2.5, 1.05], [5.65, 1.12]], easeInOut), cx: 760, cy: 700};

  // Headlight sweeping across the room (right → left).
  const sweepP = ramp(t, CUES.headlightSweep[0], CUES.headlightSweep[1], easeInOut);
  const sweepX = lerp(1900, -200, sweepP);
  const sweepOn = window4(t, CUES.headlightSweep[0] - 0.05, CUES.headlightSweep[0] + 0.1, CUES.headlightSweep[1] - 0.1, CUES.headlightSweep[1]);
  const childX = 760;
  const childLit = Math.exp(-Math.pow((sweepX - childX) / 260, 2)) * sweepOn;

  // Glint travelling along the glass toward where the slit transition opens.
  const glintP = ramp(t, CUES.windowGlint[0], CUES.windowGlint[1], easeInOut);
  const glintX = lerp(WIN.x + WIN.w - 40, 1010, glintP);
  const glintOn = window4(t, CUES.windowGlint[0], CUES.windowGlint[0] + 0.06, 9, 10);

  // Child: hugging knees → covers ears on "I hear them".
  const pEars = ramp(t, CUES.coverEars - 0.1, CUES.coverEars + 0.3, easeOut);
  const shake = Math.sin(t * Math.PI * 2 * 3.6) * 1.4 * window4(t, 4.55, 4.7, 5.25, 5.5);

  // Arguing adults across the street.
  const argue = Math.sin(t * 5.2);
  const argueA: Pose = {...ARGUE_A, aF: [100 + argue * 25, -20 - argue * 20], lean: 6 + argue * 3};

  // Raindrops sliding down the glass (deterministic stick–slip).
  const drops = Array.from({length: 46}).map((_, i) => {
    const x = WIN.x + 20 + rnd(`d-x-${i}`) * (WIN.w - 40);
    const v = rndRange(`d-v-${i}`, 30, 140);
    const y0 = rnd(`d-y-${i}`) * WIN.h;
    const slip = Math.floor(t * 2 + rnd(`d-s-${i}`) * 5) * 0.5;
    const y = WIN.y + ((y0 + v * (slip + Math.max(0, (t * 2 + rnd(`d-s-${i}`) * 5) % 1 - 0.6) * 1.2)) % WIN.h);
    const r = rndRange(`d-r-${i}`, 2.5, 6.5);
    return {x, y, r};
  });
  // The "tear" drop: one bright drop sliding slowly down beside the child.
  const tearP = ramp(t, 3.4, 5.2, (x) => x);
  const tearY = lerp(WIN.y + 120, WIN.y + WIN.h - 40, tearP);

  const L = LYRICS.children;
  return (
    <SceneFrame
      background={palette.coldRoom}
      camera={camera}
      world={
        <>
          <defs>
            <linearGradient id="ch-wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={palette.midnight} />
              <stop offset="1" stopColor={palette.coldRoom} />
            </linearGradient>
            <linearGradient id="ch-out" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={palette.midnight} />
              <stop offset="1" stopColor={palette.deepBlue} />
            </linearGradient>
            <linearGradient id="ch-floorlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={palette.sky} stopOpacity="0.16" />
              <stop offset="1" stopColor={palette.sky} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ch-sweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={palette.ivory} stopOpacity="0" />
              <stop offset="0.5" stopColor={palette.ivory} stopOpacity="0.22" />
              <stop offset="1" stopColor={palette.ivory} stopOpacity="0" />
            </linearGradient>
            <clipPath id="ch-win">
              <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} />
            </clipPath>
          </defs>
          {/* room */}
          <rect x={-300} y={-300} width={2600} height={1200} fill="url(#ch-wall)" />
          <rect x={-300} y={880} width={2600} height={500} fill={mixColor(palette.midnight, palette.coldRoom, 0.4)} />
          <line x1={-300} y1={880} x2={2300} y2={880} stroke={palette.graphite} strokeWidth={2} opacity={0.5} />
          {/* window view */}
          <g clipPath="url(#ch-win)">
            <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill="url(#ch-out)" />
            <g style={{filter: 'blur(3px)'}}>
              <Skyline seed={21} x0={WIN.x - 40} x1={WIN.x + WIN.w + 40} baseY={WIN.y + WIN.h} minH={220} maxH={520} color={mixColor(palette.asphalt, palette.midnight, 0.4)} windowColor={palette.sky} litFraction={0.1} windowOpacity={0.35} warmColor={palette.amber} warmFraction={0.25} t={t} />
            </g>
            <g style={{filter: 'blur(1.2px)'}}>
              {/* lit window across the street with the argument */}
              <rect x={1180} y={360} width={250} height={190} fill={mixColor(palette.amber, palette.graphite, 0.55)} opacity={0.85} />
              <Character x={1260} y={550} height={150} pose={argueA} facing={1} color={palette.asphalt} outfit="plain" />
              <Character x={1350} y={550} height={142} pose={ARGUE_B} facing={-1} color={palette.asphalt} outfit="dress" hair="long" />
            </g>
            <Rain t={t} seed={22} count={70} color={palette.sky} opacity={0.3} speed={900} length={26} angle={4} area={{x: WIN.x, y: WIN.y - 40, w: WIN.w, h: WIN.h + 80}} width={1.2} />
            {drops.map((d, i) => (
              <g key={i}>
                <circle cx={d.x} cy={d.y} r={d.r} fill={palette.sky} opacity={0.18} />
                <circle cx={d.x - d.r * 0.3} cy={d.y - d.r * 0.3} r={d.r * 0.35} fill={palette.ivory} opacity={0.45} />
              </g>
            ))}
            {/* tear-like drop */}
            <line x1={1090} y1={WIN.y + 100} x2={1090} y2={tearY - 8} stroke={palette.sky} strokeWidth={3} opacity={0.18} />
            <circle cx={1090} cy={tearY} r={7} fill={palette.sky} opacity={0.4} />
            <circle cx={1088} cy={tearY - 2} r={2.6} fill="#FFFFFF" opacity={0.8} />
            {/* headlight streak crossing the glass */}
            <rect x={sweepX - 120} y={WIN.y} width={240} height={WIN.h} fill="url(#ch-sweep)" opacity={sweepOn * 1.4} />
          </g>
          {/* window frame */}
          <g fill="none" stroke={palette.silhouette} strokeWidth={22}>
            <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} />
            <line x1={WIN.x + WIN.w / 2} y1={WIN.y} x2={WIN.x + WIN.w / 2} y2={WIN.y + WIN.h} strokeWidth={14} />
            <line x1={WIN.x} y1={WIN.y + WIN.h * 0.45} x2={WIN.x + WIN.w} y2={WIN.y + WIN.h * 0.45} strokeWidth={14} />
          </g>
          <rect x={WIN.x - 30} y={WIN.y + WIN.h} width={WIN.w + 60} height={22} fill={palette.silhouette} />
          {/* curtains */}
          {[
            [WIN.x - 70, 120],
            [WIN.x + WIN.w - 50, 120],
          ].map(([x, w], i) => (
            <g key={i}>
              <path d={`M${x},90 L${x + w},90 Q${x + w * 0.7},500 ${x + w * (i ? 0.9 : 0.75)},${WIN.y + WIN.h + 80} L${x + w * (i ? 0.1 : 0.05)},${WIN.y + WIN.h + 90} Q${x + w * 0.2},480 ${x},90 z`} fill={mixColor(palette.coldRoom, palette.silhouette, 0.6)} />
              {[0.3, 0.55, 0.8].map((f) => (
                <line key={f} x1={x + w * f} y1={95} x2={x + w * f + (i ? 6 : -6)} y2={WIN.y + WIN.h + 70} stroke={palette.silhouette} strokeWidth={4} opacity={0.6} />
              ))}
            </g>
          ))}
          <rect x={WIN.x - 90} y={80} width={WIN.w + 180} height={14} rx={7} fill={palette.silhouette} />
          {/* rain-mottled window light on the back wall */}
          <Glow x={760} y={520} r={360} ry={260} color={palette.sky} opacity={0.12} core={0.02} />
          {/* window light spilling on the floor */}
          <polygon points={`${WIN.x},880 ${WIN.x + WIN.w},880 ${WIN.x + WIN.w - 220},1180 ${WIN.x - 480},1180`} fill="url(#ch-floorlight)" />
          {/* headlight band across the room */}
          <polygon
            points={`${sweepX - 160},-200 ${sweepX + 160},-200 ${sweepX + 40},1300 ${sweepX - 280},1300`}
            fill="url(#ch-sweep)"
            opacity={sweepOn}
          />
          {/* fallen toy */}
          <g transform="translate(520,880) rotate(-68) scale(1.4)" fill={palette.silhouette}>
            <circle cx={0} cy={-28} r={27} />
            <circle cx={0} cy={-72} r={19} />
            <circle cx={-14} cy={-88} r={7} />
            <circle cx={14} cy={-88} r={7} />
            <circle cx={-26} cy={-36} r={9} />
            <circle cx={24} cy={-10} r={10} />
          </g>
          <Glow x={520} y={850} r={150} color={palette.ivory} opacity={Math.exp(-Math.pow((sweepX - 520) / 240, 2)) * sweepOn * 0.4} />
          {/* child */}
          <ChildHuddle
            x={childX}
            y={880}
            scale={1.3}
            ears={pEars}
            sob={shake}
            breathe={Math.sin(t * 2.2)}
            rimColor={mixColor(palette.sky, palette.ivory, childLit)}
            rimOpacity={0.45 + childLit * 0.55}
          />
          <Particles t={t} seed={23} count={26} color={palette.sky} opacity={0.25} area={{x: 200, y: 200, w: 1500, h: 700}} size={[1, 2.4]} rise={6} />
        </>
      }
      screen={
        <>
          {/* the glint that becomes the podium spotlight */}
          <rect x={glintX - 3} y={0} width={6} height={1080} fill="#FFFFFF" opacity={glintOn * 0.85} style={{filter: 'blur(2px)'}} />
          <rect x={glintX - 40} y={0} width={80} height={1080} fill={palette.ivory} opacity={glintOn * 0.18} style={{filter: 'blur(18px)'}} />
        </>
      }
      overlay={
        <LyricBlock
          t={t}
          style="soft"
          exitAt={5.2}
          lines={[
            {words: L.words.slice(0, 2), x: 140, y: 150},
            {words: L.words.slice(2), x: 140, y: 258},
          ]}
        />
      }
    />
  );
};
