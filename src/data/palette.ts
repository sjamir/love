// Primary palette from the art-direction brief, plus a few derived tones.
// Change a value here and every scene that uses it follows.
export const palette = {
  midnight: '#0B0F14', // main background, darkest moments
  asphalt: '#171C24', // buildings, streets, shadows
  graphite: '#303743', // secondary objects, character separation
  mist: '#A6AFBA', // distant elements, atmosphere
  ivory: '#F3F0E8', // lyric typography
  crimson: '#E5484D', // violence and danger (restrained)
  amber: '#FFC857', // human warmth, highlights
  guidance: '#F4D06F', // light associated with guidance
  teal: '#6BCBBA', // compassion and connection
  sky: '#9ECDF5', // rain, distant light, reflection

  // Derived tones
  silhouette: '#05070A',
  nightBlue: '#0D1724',
  deepBlue: '#13243A',
  coldRoom: '#121C29',
  lampCool: '#D7E7F5',
} as const;

export type PaletteKey = keyof typeof palette;
