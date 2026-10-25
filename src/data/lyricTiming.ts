// ─────────────────────────────────────────────────────────────────────────────
// LYRIC + SCENE TIMING MAP  (all values in seconds of the supplied recording)
//
// Source: public/where_is_the_love.mp3 (21.42 s, 44.1 kHz stereo MP3, 93.75 BPM).
// The file contains only the requested excerpt (a Shorts edit), so time 0 of the
// video is time 0 of the recording; nothing is trimmed or stretched.
//
// How these values were obtained (see qc_report.md for detail):
//   1. faster-whisper (Whisper "small", int8) word timestamps, three passes:
//      full-clip with lyric prompt, unprompted chunks, per-line prompted chunks.
//   2. Spectral-flux onset analysis -> beat grid (period 0.6375 s, phase 0.37 s).
//   3. Vocal-band (300–3400 Hz) energy envelope and spectrogram inspection.
// Word END times agreed across passes to within ~0.05 s. Whisper tends to pull
// the START of a line's first word back into the preceding gap, so first-word
// onsets were set from the consensus of passes and the onset/energy data.
//
// confidence:
//   'verified'  – consistent across all passes, word probability >= 0.9
//   'consensus' – passes disagree by 0.1–0.3 s; value is the reasoned middle
//   'estimate'  – not directly detectable; set from musical structure
//
// To retime: edit the numbers below. Scenes, lyrics and key actions all read
// from this file; nothing else holds hardcoded lyric timestamps.
// ─────────────────────────────────────────────────────────────────────────────

export const FPS = 30;
export const AUDIO_DURATION = 21.42;
export const TOTAL_FRAMES = Math.ceil(AUDIO_DURATION * FPS); // 643

export const toFrame = (seconds: number) => Math.round(seconds * FPS);

export const BEAT = {period: 0.6375, phase: 0.37, bpm: 93.75};
export const beatTime = (n: number) => BEAT.phase + n * BEAT.period;

export type Confidence = 'verified' | 'consensus' | 'estimate';
export type Emphasis = 'crimson' | 'gold' | 'amber' | 'sky' | 'teal' | 'strong';

export interface Word {
  text: string;
  start: number;
  emph?: Emphasis;
  confidence: Confidence;
}

export interface LyricLine {
  sceneId: SceneId;
  text: string;
  start: number;
  end: number;
  words: Word[];
}

export type SceneId =
  | 'violence'
  | 'children'
  | 'hypocrisy'
  | 'indifference'
  | 'plea'
  | 'guidance'
  | 'questioning'
  | 'refrainFirst'
  | 'refrainFinal';

const w = (text: string, start: number, confidence: Confidence, emph?: Emphasis): Word => ({
  text,
  start,
  confidence,
  emph,
});

export const LYRICS: Record<SceneId, LyricLine> = {
  violence: {
    sceneId: 'violence',
    text: "People killin' people dyin'",
    start: 0.8,
    end: 2.74,
    words: [
      w('People', 0.8, 'consensus'),
      w("killin'", 0.98, 'consensus', 'crimson'),
      w('people', 1.5, 'consensus'),
      w("dyin'", 1.88, 'verified', 'strong'),
    ],
  },
  children: {
    sceneId: 'children',
    text: "Children hurtin', I hear them cryin'",
    start: 2.72,
    end: 5.3,
    words: [
      w('Children', 2.72, 'consensus', 'sky'),
      w("hurtin',", 3.25, 'consensus'),
      w('I', 4.18, 'consensus'),
      w('hear', 4.3, 'consensus'),
      w('them', 4.44, 'verified'),
      w("cryin'", 4.64, 'verified', 'sky'),
    ],
  },
  hypocrisy: {
    sceneId: 'hypocrisy',
    text: 'Could you practice what you preach?',
    start: 5.55,
    end: 7.54,
    words: [
      w('Could', 5.55, 'consensus'),
      w('you', 5.7, 'verified'),
      w('practice', 5.88, 'verified', 'strong'),
      w('what', 6.4, 'verified'),
      w('you', 6.85, 'verified'),
      w('preach?', 7.12, 'verified', 'amber'),
    ],
  },
  indifference: {
    sceneId: 'indifference',
    text: 'Would you turn the other cheek?',
    start: 7.95,
    end: 10.02,
    words: [
      w('Would', 7.95, 'consensus'),
      w('you', 8.18, 'verified'),
      w('turn', 8.42, 'verified', 'strong'),
      w('the', 8.8, 'consensus'),
      w('other', 9.04, 'consensus'),
      w('cheek?', 9.52, 'verified', 'strong'),
    ],
  },
  plea: {
    sceneId: 'plea',
    text: 'Father, Father, Father help us',
    start: 10.45,
    end: 13.12,
    words: [
      w('Father,', 10.45, 'consensus', 'strong'),
      w('Father,', 11.05, 'consensus', 'strong'),
      w('Father', 11.7, 'verified', 'strong'),
      w('help', 12.12, 'consensus', 'amber'),
      w('us', 12.5, 'verified', 'amber'),
    ],
  },
  guidance: {
    sceneId: 'guidance',
    text: 'Send some guidance from above',
    start: 13.22,
    end: 15.0,
    words: [
      w('Send', 13.22, 'consensus'),
      w('some', 13.38, 'verified'),
      w('guidance', 13.58, 'verified', 'gold'),
      w('from', 14.03, 'verified'),
      w('above', 14.47, 'verified', 'gold'),
    ],
  },
  questioning: {
    sceneId: 'questioning',
    text: "'Cause people got me, got me questioning",
    start: 15.5,
    end: 18.05,
    words: [
      w("'Cause", 15.5, 'consensus'),
      w('people', 15.68, 'verified'),
      w('got', 16.0, 'verified', 'strong'),
      w('me,', 16.42, 'verified', 'strong'),
      w('got', 16.82, 'verified', 'strong'),
      w('me', 17.02, 'verified', 'strong'),
      w('questioning', 17.32, 'consensus', 'sky'),
    ],
  },
  refrainFirst: {
    sceneId: 'refrainFirst',
    text: "(Where's the love?)",
    start: 18.85,
    end: 20.3,
    words: [
      w("Where's", 18.85, 'consensus'),
      w('the', 19.44, 'verified'),
      w('love?', 19.7, 'consensus', 'amber'),
    ],
  },
  refrainFinal: {
    // Only one clearly sung "Where's the love?" is detectable in this 21.4 s
    // edit. Sustained vocal harmonics continue from ~20.3 s to the hard end of
    // the file, so the second refrain is placed on that tail. ESTIMATE.
    sceneId: 'refrainFinal',
    text: "(Where's the love?)",
    start: 20.3,
    end: AUDIO_DURATION,
    words: [
      w("(Where's", 20.3, 'estimate'),
      w('the', 20.3, 'estimate'),
      w('love?)', 20.3, 'estimate', 'gold'),
    ],
  },
};

// Key character / light cues, all tied to the vocal performance.
export const CUES = {
  // Scene 1
  aggressorStops: 0.72,
  gunRaise: [0.52, 0.92] as const,
  gunshot: 1.0, // on "killin'" + strong transient at 1.00 s
  victimKneels: 1.55,
  victimFalls: [1.9, 2.5] as const, // across "dyin'"
  crimsonRipple: 2.0,
  // Scene 2
  coverEars: 4.18, // "I hear them"
  headlightSweep: [4.62, 5.1] as const,
  windowGlint: [4.95, 5.2] as const,
  // Scene 3
  reachOut: 6.4, // "what"
  shadowFalls: [6.85, 7.45] as const, // "you preach?"
  lightCools: 7.12,
  speakerTurnsAway: 7.42,
  // Scene 4
  passerbyStops: 8.55,
  recognition: [8.55, 9.0] as const, // around "turn"
  headTurnsAway: [9.04, 9.32] as const, // "other"
  walksOn: 9.35,
  lookUp: 9.85,
  // Scene 5: one pulse per sung "Father" (not evenly spaced)
  fathers: [10.45, 11.05, 11.7] as const,
  helpUs: 12.12,
  cloudsOpen: [12.1, 13.0] as const,
  // Scene 6
  beamLands: 13.7,
  lampsStart: 13.75,
  lampStep: 0.16,
  helperWalks: [14.15, 15.35] as const,
  windowsLight: [14.75, 15.15] as const,
  // Scene 7
  reflection1: 16.0, // first "got me"
  reflection2: 16.82, // second "got me"
  misalign: 17.32, // "questioning"
  questionMarkDraw: [17.35, 18.05] as const,
  fragment: [17.95, 18.45] as const,
  // Scene 8
  lookAcross: 19.4,
  loveGlow: 19.7,
  gapFills: [20.0, 20.55] as const,
  leftSteps: 20.12,
  rightResponds: 20.32,
  handsConnect: [20.55, 20.85] as const,
  lightSpreads: [20.7, 21.15] as const,
  endFade: [AUDIO_DURATION - 0.42, AUDIO_DURATION] as const,
};

// ── Scene sequence ───────────────────────────────────────────────────────────
// `start` is when the scene begins to appear (its incoming transition starts).
// The previous scene stays on screen until start + transition.duration.

export type Transition =
  | {type: 'cut'}
  | {type: 'ripple'; duration: number; x: number; y: number}
  | {type: 'slit'; duration: number; x: number}
  | {type: 'pan'; duration: number; direction: 1 | -1}
  | {type: 'tilt'; duration: number}
  | {type: 'bloom'; duration: number; x: number; y: number}
  | {type: 'window'; duration: number; rect: {x: number; y: number; w: number; h: number}}
  | {type: 'dissolve'; duration: number};

export interface SceneTiming {
  id: SceneId;
  start: number;
  transition: Transition;
}

// Guidance scene "hero window" that the camera flies into for scene 7.
export const HERO_WINDOW = {x: 1496, y: 392, w: 192, h: 108};

export const SCENES: SceneTiming[] = [
  {id: 'violence', start: 0, transition: {type: 'cut'}},
  // Pavement ripple under the victim opens into rain on a window.
  {id: 'children', start: 2.5, transition: {type: 'ripple', duration: 0.6, x: 1150, y: 880}},
  // Headlight glint on the glass becomes the podium spotlight.
  {id: 'hypocrisy', start: 5.15, transition: {type: 'slit', duration: 0.5, x: 1010}},
  // Speaker turns head away; camera pans with it.
  {id: 'indifference', start: 7.5, transition: {type: 'pan', duration: 0.48, direction: 1}},
  // Person looks up; camera tilts to the sky.
  {id: 'plea', start: 9.95, transition: {type: 'tilt', duration: 0.5}},
  // Three pulses merged in the cloud opening bloom into a single beam.
  {id: 'guidance', start: 12.85, transition: {type: 'bloom', duration: 0.5, x: 960, y: 190}},
  // Beam lights the windows; camera flies into one of them.
  {id: 'questioning', start: 15.12, transition: {type: 'window', duration: 0.56, rect: HERO_WINDOW}},
  // Fragmented reflections collapse into the single central question mark.
  {id: 'refrainFirst', start: 18.25, transition: {type: 'dissolve', duration: 0.6}},
  // Same composition; the second refrain grows out of the warm "love?" glow.
  {id: 'refrainFinal', start: 19.95, transition: {type: 'dissolve', duration: 0.3}},
];
