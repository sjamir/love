import React from 'react';
import {AbsoluteFill} from 'remotion';
import {HEIGHT, WIDTH} from '../data/visualConfig';

export interface Camera {
  scale?: number;
  cx?: number; // zoom centre
  cy?: number;
  x?: number; // pan offset (px)
  y?: number;
  rotate?: number;
}

export const cameraTransform = ({scale = 1, cx = WIDTH / 2, cy = HEIGHT / 2, x = 0, y = 0, rotate = 0}: Camera) =>
  `translate(${cx + x},${cy + y}) rotate(${rotate}) scale(${scale}) translate(${-cx},${-cy})`;

/**
 * A scene = background colour + camera-driven SVG world + screen-space SVG
 * (effects that should not move with the camera) + HTML overlay (lyrics).
 */
export const SceneFrame: React.FC<{
  background: string;
  camera?: Camera;
  world: React.ReactNode;
  screen?: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({background, camera = {}, world, screen, overlay}) => (
  <AbsoluteFill style={{background, overflow: 'hidden'}}>
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{position: 'absolute', inset: 0}}>
      <g transform={cameraTransform(camera)}>{world}</g>
      {screen}
    </svg>
    {overlay}
  </AbsoluteFill>
);
