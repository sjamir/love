import React from 'react';
import {Composition} from 'remotion';
import '@fontsource/anton/400.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import {VideoComposition} from './VideoComposition';
import {FPS, TOTAL_FRAMES} from './data/lyricTiming';
import {HEIGHT, WIDTH} from './data/visualConfig';

export const RemotionRoot: React.FC = () => (
  <Composition id="WhereIsTheLove" component={VideoComposition} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
);
