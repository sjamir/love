# Where Is the Love? — animated lyric film

A 21-second cinematic motion-graphics film for the supplied excerpt of *Where Is the Love?* by The Black Eyed Peas. It is built in Remotion (React + TypeScript + SVG) and synchronised to the supplied recording.

## Deliverables (`output/`)

| File | What |
|---|---|
| `where_is_the_love_final.mp4` | Final master: 1920×1080, 30 fps, H.264 + AAC |
| `where_is_the_love_preview.mp4` | 1280×720 preview (same frames and timing) |
| `storyboard.md` | Scene-by-scene meaning, action, colour, type and transitions |
| `qc_report.md` | Stream validation, sync checks and known limitations |
| `qc/` | Contact sheets from the final render and the audio spectrogram |

The editable timing configuration is **`src/data/lyricTiming.ts`**.

## Audio

`public/where_is_the_love.mp3`: the uploaded file, unmodified. It is 21.42 s long and contains only the requested excerpt. It is the only soundtrack, apart from a 0.3 s fade on its final hard cut.

## Requirements

- Node 18+ and npm
- ffmpeg/ffprobe (used for the preview downscale and for validation)
- A Chromium headless shell. `remotion.config.ts` uses the locally installed one at `/opt/pw-browsers/...` if present, or the path in `REMOTION_BROWSER_EXECUTABLE`. Otherwise Remotion downloads its own.

```bash
npm install
```

## Preview and render

```bash
npm run studio          # interactive preview with scrubbing + audio (Remotion Studio)
npm run render:draft    # fast 960×540 draft -> output/draft_960x540.mp4
npm run render:final    # 1920×1080 master -> output/where_is_the_love_final.mp4 (~3 min on 4 cores)
npm run render:preview  # 1280×720 preview made from the master (run after render:final)
npm run typecheck
```

Single frame: `npx remotion still src/index.ts WhereIsTheLove out.png --frame=300`

## Project structure

```
src/
  index.ts / Root.tsx         composition registration (1920×1080, 30 fps, 643 frames)
  VideoComposition.tsx        sequences scenes by timing, applies transitions, grain, end fade, audio
  data/
    lyricTiming.ts            ALL timing: words, cues, scene starts, transition types/durations
    palette.ts                colour tokens
    visualConfig.ts           canvas, fonts, type scale, safe area, grain/vignette, light params
  components/
    Character.tsx             silhouette pose rig (adult/child/elder; coat/dress/hood; walk cycle)
    City.tsx                  skyline + shared one-point perspective street (scenes 1 and 6)
    Atmosphere.tsx            rain, fog, particles, film grain + vignette
    Light.tsx                 glows, beams, rings, light lines, the question-mark stroke
    LyricText.tsx             timed kinetic typography (rise / soft / light / solemn)
    SceneFrame.tsx            camera transform + SVG world + overlay
  scenes/                     one file per lyric scene (refrains share RefrainScenes.tsx)
  transitions/SceneTransition.tsx   ripple, slit, pan, tilt, bloom, window fly-through, dissolve
  utils/anim.ts               deterministic easing/keyframe/random helpers (no frame state)
```

Every frame is a pure function of time, and all randomness is seeded. Any frame renders identically on its own.

## Changing things

- **Timing:** edit `src/data/lyricTiming.ts`.
  - `LYRICS` holds per-word onsets.
  - `CUES` holds character and light actions (gunshot, the three "Father" pulses, head turns and so on).
  - `SCENES` holds when each scene starts and which transition brings it in.

  Values are in seconds of the recording and are converted to frames at 30 fps.
- **Colours:** edit `src/data/palette.ts`.
- **Fonts and type sizes:** edit `fonts` and `typeScale` in `src/data/visualConfig.ts`. Anton and Inter are bundled locally through `@fontsource`, so nothing is fetched at render time.
- **Grain, vignette, end fade and audio fade:** edit `effects` in `visualConfig.ts`.
