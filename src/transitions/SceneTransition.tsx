import React from 'react';
import {Transition} from '../data/lyricTiming';
import {palette} from '../data/palette';
import {HEIGHT, WIDTH} from '../data/visualConfig';
import {Glow} from '../components/Light';
import {easeInOut, lerp} from '../utils/anim';

// Each transition defines how the INCOMING scene appears, how the OUTGOING
// scene leaves, and an optional accent drawn over both (the light/ripple that
// motivates the change). p runs 0→1 over the transition's duration.

export const transitionDuration = (tr: Transition) => (tr.type === 'cut' ? 0 : tr.duration);

export const incomingStyle = (tr: Transition, p: number): React.CSSProperties => {
  const e = easeInOut(p);
  switch (tr.type) {
    case 'cut':
      return {};
    case 'ripple':
      return {clipPath: `circle(${lerp(0, 2300, Math.pow(e, 1.4))}px at ${tr.x}px ${tr.y}px)`};
    case 'slit': {
      const half = lerp(2, WIDTH, Math.pow(e, 1.6));
      return {clipPath: `inset(0px ${Math.max(0, WIDTH - tr.x - half)}px 0px ${Math.max(0, tr.x - half)}px)`};
    }
    case 'pan':
      return {transform: `translateX(${-tr.direction * (1 - e) * WIDTH}px)`, filter: `blur(${Math.sin(Math.PI * p) * 5}px)`};
    case 'tilt':
      return {transform: `translateY(${-(1 - e) * HEIGHT}px)`, filter: `blur(${Math.sin(Math.PI * p) * 4}px)`};
    case 'bloom':
      const r = lerp(0, 2400, Math.pow(e, 1.3));
      const mask = `radial-gradient(circle at ${tr.x}px ${tr.y}px, #000 ${r}px, transparent ${r + 420}px)`;
      return {maskImage: mask, WebkitMaskImage: mask, opacity: Math.min(1, p * 2.5)};
    case 'window': {
      const {Z, cx, cy, k} = windowZoom(tr.rect, p);
      const s = k * Z;
      return {transformOrigin: '0 0', transform: `translate(${cx - (WIDTH / 2) * s}px, ${cy - (HEIGHT / 2) * s}px) scale(${s})`, opacity: Math.min(1, p * 3)};
    }
    case 'dissolve':
      return {opacity: e};
  }
};

export const outgoingStyle = (tr: Transition | undefined, p: number): React.CSSProperties => {
  if (!tr || p <= 0) return {};
  const e = easeInOut(p);
  switch (tr.type) {
    case 'ripple':
      return {transformOrigin: `${tr.x}px ${tr.y}px`, transform: `scale(${1 + 0.2 * e})`, filter: `blur(${e * 4}px)`};
    case 'slit':
      return {filter: `brightness(${1 - 0.5 * e})`};
    case 'pan':
      return {transform: `translateX(${tr.direction * e * WIDTH}px)`, filter: `blur(${Math.sin(Math.PI * p) * 5}px)`};
    case 'tilt':
      return {transform: `translateY(${e * HEIGHT}px)`, filter: `blur(${Math.sin(Math.PI * p) * 4}px)`};
    case 'bloom':
      return {filter: `brightness(${1 + 0.8 * e})`};
    case 'window': {
      const {Z, cx, cy} = windowZoom(tr.rect, p);
      const rcx = tr.rect.x + tr.rect.w / 2;
      const rcy = tr.rect.y + tr.rect.h / 2;
      return {transformOrigin: '0 0', transform: `translate(${cx - rcx * Z}px, ${cy - rcy * Z}px) scale(${Z})`};
    }
    default:
      return {};
  }
};

/** Fly-through into a rectangle: outgoing zooms into it, incoming fills it. */
const windowZoom = (rect: {x: number; y: number; w: number; h: number}, p: number) => {
  const e = easeInOut(p);
  const k = rect.w / WIDTH;
  const Z = Math.pow(1 / k, e);
  return {Z, k, cx: lerp(rect.x + rect.w / 2, WIDTH / 2, e), cy: lerp(rect.y + rect.h / 2, HEIGHT / 2, e)};
};

/** The light that motivates each change, drawn above both scenes. */
export const TransitionAccent: React.FC<{tr: Transition; p: number}> = ({tr, p}) => {
  if (p <= 0 || p >= 1) return null;
  const e = easeInOut(p);
  const fade = Math.sin(Math.PI * p);
  switch (tr.type) {
    case 'ripple': {
      const r = lerp(0, 2300, Math.pow(e, 1.4));
      return (
        <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
          <circle cx={tr.x} cy={tr.y} r={r} fill="none" stroke={palette.sky} strokeWidth={14} opacity={0.35 * fade} style={{filter: 'blur(8px)'}} />
          <circle cx={tr.x} cy={tr.y} r={r} fill="none" stroke={palette.ivory} strokeWidth={2} opacity={0.6 * fade} />
        </svg>
      );
    }
    case 'slit': {
      const half = lerp(2, WIDTH, Math.pow(e, 1.6));
      return (
        <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
          {[tr.x - half, tr.x + half].map((x, i) => (
            <g key={i} opacity={fade}>
              <rect x={x - 30} y={0} width={60} height={HEIGHT} fill={palette.ivory} opacity={0.25} style={{filter: 'blur(16px)'}} />
              <rect x={x - 2} y={0} width={4} height={HEIGHT} fill="#FFFFFF" opacity={0.85} />
            </g>
          ))}
        </svg>
      );
    }
    case 'bloom':
      return (
        <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
          <Glow x={tr.x} y={tr.y} r={lerp(120, 1400, e)} color={palette.guidance} opacity={0.75 * fade} core={0.08} />
        </svg>
      );
    default:
      return null;
  }
};
