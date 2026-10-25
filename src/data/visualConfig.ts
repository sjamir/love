// Central visual configuration: canvas, fonts, type scale, global effects.

export const WIDTH = 1920;
export const HEIGHT = 1080;

// Audio file in /public, used as the only soundtrack.
export const AUDIO_FILE = 'where_is_the_love.mp3';

export const fonts = {
  // Condensed display face for lyrics (bundled locally via @fontsource/anton).
  display: "'Anton', 'Bebas Neue', 'Oswald', 'Impact', 'Arial Narrow', sans-serif",
  // Secondary face (bundled via @fontsource/inter, also installed system-wide here).
  text: "'Inter', 'Manrope', 'Helvetica Neue', Arial, sans-serif",
};

export const typeScale = {
  lyric: 92, // standard lyric line
  lyricSmall: 74,
  refrain: 128, // final refrain
  solemn: 84, // plea scene
};

// Title-safe area (lyrics are kept inside it).
export const safe = {left: 140, right: 1780, top: 110, bottom: 970};

export const effects = {
  grainOpacity: 0.07,
  vignetteStrength: 0.62,
  // Fade to black at the very end, aligned to the audio end.
  endFadeSeconds: 0.42,
  // Short audio fade so the hard cut at the end of the supplied clip doesn't click.
  audioFadeOutSeconds: 0.3,
};

export const light = {
  pulseRise: 1.15, // seconds for a "Father" pulse to travel to the clouds
  pulseRingRadius: 340,
  beamWidthTop: 60,
  beamWidthBottom: 260,
};
