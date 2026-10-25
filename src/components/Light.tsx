import React from 'react';

const gid = (prefix: string, color: string) => `${prefix}-${color.replace('#', '')}`;

/** Soft radial glow. */
export const Glow: React.FC<{x: number; y: number; r: number; color: string; opacity?: number; core?: number; ry?: number}> = ({
  x,
  y,
  r,
  color,
  opacity = 1,
  core = 0.12,
  ry,
}) => {
  const id = gid(`glow${Math.round(core * 100)}`, color);
  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset={core} stopColor={color} stopOpacity="0.75" />
          <stop offset="0.45" stopColor={color} stopOpacity="0.18" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={r} ry={ry ?? r} fill={`url(#${id})`} />
    </g>
  );
};

/** Tapered light beam between two points, fading toward the end. */
export const Beam: React.FC<{x1: number; y1: number; x2: number; y2: number; w1: number; w2: number; color: string; opacity?: number; blur?: number}> = ({
  x1,
  y1,
  x2,
  y2,
  w1,
  w2,
  color,
  opacity = 1,
  blur = 10,
}) => {
  const id = gid('beam', color);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  const p = [
    [x1 + (nx * w1) / 2, y1 + (ny * w1) / 2],
    [x2 + (nx * w2) / 2, y2 + (ny * w2) / 2],
    [x2 - (nx * w2) / 2, y2 - (ny * w2) / 2],
    [x1 - (nx * w1) / 2, y1 - (ny * w1) / 2],
  ];
  return (
    <g opacity={opacity} style={{filter: `blur(${blur}px)`}}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
          <stop offset="0" stopColor={color} stopOpacity="0.85" />
          <stop offset="0.7" stopColor={color} stopOpacity="0.4" />
          <stop offset="1" stopColor={color} stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <polygon points={p.map((q) => q.join(',')).join(' ')} fill={`url(#${id})`} />
      <polygon
        points={[
          [x1 + (nx * w1) / 6, y1 + (ny * w1) / 6],
          [x2 + (nx * w2) / 8, y2 + (ny * w2) / 8],
          [x2 - (nx * w2) / 8, y2 - (ny * w2) / 8],
          [x1 - (nx * w1) / 6, y1 - (ny * w1) / 6],
        ]
          .map((q) => q.join(','))
          .join(' ')}
        fill="#FFFFFF"
        opacity={0.35}
      />
    </g>
  );
};

/** Expanding ring on a ground plane (ellipse) or in the air (circle). */
export const Ring: React.FC<{x: number; y: number; r: number; squash?: number; color: string; opacity: number; width?: number; blur?: number}> = ({
  x,
  y,
  r,
  squash = 1,
  color,
  opacity,
  width = 3,
  blur = 0,
}) => (
  <ellipse
    cx={x}
    cy={y}
    rx={Math.max(0, r)}
    ry={Math.max(0, r * squash)}
    fill="none"
    stroke={color}
    strokeWidth={width}
    opacity={opacity}
    style={blur ? {filter: `blur(${blur}px)`} : undefined}
  />
);

/** A thin glowing line of light, drawn on progressively (0..1). */
export const LightLine: React.FC<{d: string; length: number; progress: number; color: string; width?: number; opacity?: number}> = ({
  d,
  length,
  progress,
  color,
  width = 4,
  opacity = 1,
}) => (
  <g opacity={opacity} fill="none" strokeLinecap="round">
    <path d={d} stroke={color} strokeWidth={width * 5} strokeDasharray={length} strokeDashoffset={length * (1 - progress)} opacity={0.25} style={{filter: 'blur(8px)'}} />
    <path d={d} stroke={color} strokeWidth={width} strokeDasharray={length} strokeDashoffset={length * (1 - progress)} />
    <path d={d} stroke="#FFFFFF" strokeWidth={width * 0.4} strokeDasharray={length} strokeDashoffset={length * (1 - progress)} opacity={0.7} />
  </g>
);

/** The recurring question-mark symbol drawn as a single stroke of light. */
export const QUESTION_PATH = 'M -70 -95 C -70 -175 70 -175 70 -95 C 70 -40 0 -30 0 25';
export const QUESTION_LEN = 330;
export const QuestionMark: React.FC<{x: number; y: number; scale: number; progress: number; color: string; dotColor: string; dot: number; opacity?: number; width?: number}> = ({
  x,
  y,
  scale,
  progress,
  color,
  dotColor,
  dot,
  opacity = 1,
  width = 7,
}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
    {progress > 0.01 && <LightLine d={QUESTION_PATH} length={QUESTION_LEN} progress={progress} color={color} width={width} />}
    {dot > 0 && (
      <g opacity={Math.min(1, dot)}>
        <circle cx={0} cy={80} r={34 * dot} fill={dotColor} opacity={0.3} style={{filter: 'blur(12px)'}} />
        <circle cx={0} cy={80} r={10} fill={dotColor} />
        <circle cx={0} cy={80} r={4.5} fill="#FFFFFF" opacity={0.8} />
      </g>
    )}
  </g>
);
