import React from 'react';
import {Emphasis, Word} from '../data/lyricTiming';
import {palette} from '../data/palette';
import {fonts, typeScale} from '../data/visualConfig';
import {clamp, easeOut, ramp} from '../utils/anim';

// Words appear a frame ahead of the sung onset so they read as "on" the vocal.
const LEAD = 0.04;

export type LyricStyle = 'rise' | 'soft' | 'light' | 'solemn';

const emphColor: Record<Emphasis, string> = {
  crimson: palette.crimson,
  gold: palette.guidance,
  amber: palette.amber,
  sky: palette.sky,
  teal: palette.teal,
  strong: palette.ivory,
};

export interface LyricLineSpec {
  words: Word[];
  x: number;
  y: number;
  align?: 'left' | 'center' | 'right';
  size?: number;
  charReveal?: boolean; // character-by-character reveal (used sparingly)
  wordOffsets?: number[]; // extra px x-offset per word for rhythmic placement
}

const STYLE: Record<LyricStyle, {dur: number; dy: number; blur: number; tracking: number}> = {
  rise: {dur: 0.22, dy: 26, blur: 8, tracking: 0},
  soft: {dur: 0.4, dy: 12, blur: 10, tracking: 0},
  light: {dur: 0.3, dy: 0, blur: 14, tracking: 0.04},
  solemn: {dur: 0.5, dy: 8, blur: 6, tracking: 0.12},
};

export const LyricBlock: React.FC<{
  t: number;
  lines: LyricLineSpec[];
  style?: LyricStyle;
  exitAt?: number;
  exitDur?: number;
  baseColor?: string;
  glow?: string;
}> = ({t, lines, style = 'rise', exitAt = 999, exitDur = 0.35, baseColor = palette.ivory, glow}) => {
  const S = STYLE[style];
  const exit = ramp(t, exitAt, exitAt + exitDur);
  if (exit >= 1) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - exit, transform: `translateY(${-14 * exit}px)`, filter: exit > 0 ? `blur(${exit * 6}px)` : undefined}}>
      {lines.map((line, li) => {
        const size = line.size ?? typeScale.lyric;
        const align = line.align ?? 'left';
        const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
        return (
          <div
            key={li}
            style={{
              position: 'absolute',
              left: line.x,
              top: line.y,
              transform: `translateX(${tx})`,
              whiteSpace: 'nowrap',
              fontFamily: fonts.display,
              fontSize: size,
              lineHeight: 1,
              letterSpacing: `${0.02 + S.tracking}em`,
              textTransform: 'uppercase',
              color: baseColor,
            }}
          >
            {line.words.map((w, wi) => {
              const p = ramp(t, w.start - LEAD, w.start - LEAD + S.dur, easeOut);
              const col = w.emph ? emphColor[w.emph] : baseColor;
              const dim = w.emph ? 1 : 0.88;
              // Emphasised words get a small, short scale accent on their onset.
              const accent = w.emph && w.emph !== 'strong' ? 1 + 0.07 * (1 - ramp(t, w.start, w.start + 0.35, easeOut)) * (p > 0 ? 1 : 0) : 1;
              const shadow = [
                '0 3px 18px rgba(0,0,0,0.75)',
                '0 0 2px rgba(0,0,0,0.6)',
                w.emph && w.emph !== 'strong' ? `0 0 ${26 * p}px ${col}55` : '',
                glow ? `0 0 30px ${glow}` : '',
              ]
                .filter(Boolean)
                .join(', ');
              const extraTracking = style === 'solemn' ? (1 - p) * 0.08 : 0;
              const content = line.charReveal ? (
                <>
                  {w.text.split('').map((ch, ci) => {
                    const cp = ramp(t, w.start - LEAD + ci * 0.045, w.start - LEAD + ci * 0.045 + 0.2, easeOut);
                    return (
                      <span key={ci} style={{display: 'inline-block', opacity: cp, transform: `translateY(${(1 - cp) * 14}px)`, filter: `blur(${(1 - cp) * 6}px)`}}>
                        {ch}
                      </span>
                    );
                  })}
                </>
              ) : (
                w.text
              );
              return (
                <span
                  key={wi}
                  style={{
                    display: 'inline-block',
                    marginRight: wi < line.words.length - 1 && w.text !== '(' && line.words[wi + 1].text !== ')' ? '0.26em' : 0,
                    marginLeft: line.wordOffsets?.[wi] ?? 0,
                    opacity: line.charReveal ? (p > 0 ? dim : 0) : clamp(p) * dim,
                    transform: `translateY(${line.charReveal ? 0 : (1 - p) * S.dy}px) scale(${accent})`,
                    transformOrigin: '50% 80%',
                    filter: !line.charReveal && p < 1 ? `blur(${(1 - p) * S.blur}px)` : undefined,
                    color: col,
                    letterSpacing: extraTracking ? `${0.02 + S.tracking + extraTracking}em` : undefined,
                    textShadow: shadow,
                  }}
                >
                  {content}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
