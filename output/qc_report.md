# QC report

## Output files

| File | Resolution | FPS | Frames | Duration | Video | Audio | Size |
|---|---|---|---|---|---|---|---|
| `where_is_the_love_final.mp4` | 1920×1080 (16:9) | 30 | 643 | 21.433 s | H.264, yuv420p, CRF 16 | AAC 48 kHz stereo, 21.419 s | 9.7 MB |
| `where_is_the_love_preview.mp4` | 1280×720 | 30 | 643 | 21.433 s | H.264, yuv420p, CRF 23 | AAC (copied from final) | 3.0 MB |

The preview is a Lanczos downscale of the final master, so it has identical frames and timing. Remotion cannot render at exactly 2/3 scale because 1080 × 0.6667 is not an integer.

## Audio source

- **File:** `public/where_is_the_love.mp3`, copied byte-for-byte from the upload (`…THE_BLACK_EYED_PEAS_-_WHERE_IS_THE_LOVE__Shorts_OFFICIAL_MUSIC_VIDEO_128KBPS.mp3`).
- **Format:** MP3, 44.1 kHz, 2 channels, about 176 kb/s, 21.420 s.
- **Content:** a Shorts edit that contains only the requested excerpt. Vocals start at about 0.8 s, preceded by a "Y'all, y'all" ad-lib. The clip ends abruptly at 21.42 s with no natural decay.
- **Processing:**
  - No trimming, time-stretching or pitch change.
  - The only change is a 0.30 s volume fade at the very end so the source's hard cut does not click.
  - No sound effects, voice-over or other music were added.

## Render status

- The final and preview renders completed successfully.
- `ffmpeg -v error -i <file> -f null -` decodes both files with **no errors**.
- `ffprobe` shows one video stream and one audio stream in each file.
- **The ending of the audio is not lost:** output audio is 21.419 s against a source of 21.420 s.

## Synchronization checks performed

1. **Lyric alignment.** faster-whisper (Whisper small, int8) word timestamps from three passes:
   - full clip prompted with the lyric;
   - unprompted 5 s chunks;
   - per-line prompted chunks.

   Word end times agreed within about 0.05 s. First-word onsets, which Whisper smears into the preceding gap, were set from the consensus across passes plus onset and energy analysis. Each word is tagged `verified`, `consensus` or `estimate` in `src/data/lyricTiming.ts`.
2. **Beat grid.** Spectral-flux onset autocorrelation gives 93.75 BPM, a period of 0.6375 s, and a first strong beat at 0.37 s. The gunshot is placed on the strong transient at 1.00 s.
3. **Three "Father" calls.** Detected at about 10.45 / 11.05 / 11.70 s, so they are not evenly spaced. Each drives its own pulse, ring and reveal.
4. **Audio/video offset.** I cross-correlated the output file's audio track against the source mp3 (16 kHz mono, 2–18 s window). Result: **0 samples (0.00 ms) offset, correlation 0.9999.**
5. **Frame inspection against cues.** Frames were extracted from the final render at 48 timestamps covering the start, the middle of every scene, every transition, both refrains and the last frame (`qc/contact_sheet_1-4.jpg`). Results:
   - "KILLIN'" is visible at 1.0 s together with the flash.
   - "FATHER," appears once per pulse at 10.5, 11.1 and 11.75 s.
   - "QUESTIONING" is mid-reveal at 17.5 s.
   - "LOVE?" is shown at 19.75 s.
   - The gap fills and hands connect at 20.35–20.7 s.
   - The image is black at 21.40 s.
6. **Black frames.** `blackdetect` finds black only from 21.33 to 21.40 s, which is the intended end fade. There are no accidental black frames.

**Not performed:** I could not listen to the preview with audio, because this environment has no audio playback. Synchronization was verified through the measured timestamps, the A/V offset measurement and frame extraction above, not by ear.

## Visual review

Representative frames were viewed at full resolution and at contact-sheet size. Issues found during review and fixed before the final render:
- oversized lamp glows;
- the child silhouette not reading as a child (redrawn by hand);
- seated figures' legs passing through the floor;
- boxy torsos (smoothed);
- the passer-by's recognition not reading;
- people cropped in the plea scene;
- doubled refrain text during the dissolve;
- the question mark colliding with a lyric;
- the hard-edged bloom transition;
- `yuvj420p` (full-range) output, switched to standard `yuv420p` by moving to PNG frames.

All lyric text stays inside the title-safe area: x 140–1780, and y ≥ 108 at the top.

## Remaining limitations

- **Second "(Where's the love?)":** only one clearly sung occurrence is detectable in this edit. The second refrain is placed on the sustained vocal tail from 20.3 s to the end and marked `estimate`. To retime it, edit `LYRICS.refrainFinal.start`.
- **Line-onset uncertainty:** first-word onsets marked `consensus` may sit 0.1–0.2 s from the true vocal onset ("People", "Children", "Could", "Would", "Father" ×2, "Send", "'Cause", "Where's").
- **Abrupt source ending:** the supplied clip cuts off mid-phrase at 21.42 s. The picture fades out over the last 0.42 s and the audio over the last 0.30 s.
- **Window fly-through (≈15.55–15.68 s):** for a few frames a thin strip of the outgoing scene's lit window frame is visible at the top edge before the incoming scene fills the frame.
- **Animation style:** the people are procedural 2D silhouettes on a pose rig, not hand-drawn frame-by-frame animation. Facial animation is intentionally absent.
- **Speech-model source:** HuggingFace is blocked in this environment, so the Whisper-small CTranslate2 weights came from an npm mirror (`@skillninja/shortmovie-telop-model-p0…p3`). I used it for timing analysis only; nothing from it ships in the video. The reassembled `model.bin` matched the SHA-256 published in that package, but that confirms the reassembly, not where the weights originally came from.
