import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile} from 'remotion';
import {FilmFinish} from './components/Atmosphere';
import {AUDIO_DURATION, CUES, FPS, SCENES, SceneId} from './data/lyricTiming';
import {palette} from './data/palette';
import {AUDIO_FILE, effects, fonts} from './data/visualConfig';
import {ChildrenScene} from './scenes/ChildrenScene';
import {GuidanceScene} from './scenes/GuidanceScene';
import {HypocrisyScene} from './scenes/HypocrisyScene';
import {IndifferenceScene} from './scenes/IndifferenceScene';
import {PleaScene} from './scenes/PleaScene';
import {QuestioningScene} from './scenes/QuestioningScene';
import {FinalRefrainScene, FirstRefrainScene} from './scenes/RefrainScenes';
import {ViolenceScene} from './scenes/ViolenceScene';
import {incomingStyle, outgoingStyle, TransitionAccent, transitionDuration} from './transitions/SceneTransition';
import {clamp, ramp, useTime} from './utils/anim';

const SCENE_COMPONENTS: Record<SceneId, React.FC<{t: number}>> = {
  violence: ViolenceScene,
  children: ChildrenScene,
  hypocrisy: HypocrisyScene,
  indifference: IndifferenceScene,
  plea: PleaScene,
  guidance: GuidanceScene,
  questioning: QuestioningScene,
  refrainFirst: FirstRefrainScene,
  refrainFinal: FinalRefrainScene,
};

const useFonts = () => {
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    const families = [fonts.display.split(',')[0], fonts.text.split(',')[0]].map((f) => f.replace(/'/g, ''));
    Promise.all([document.fonts.load(`96px ${families[0]}`), document.fonts.load(`600 24px ${families[1]}`)])
      .catch(() => undefined)
      .then(() => continueRender(handle));
  }, [handle]);
};

export const VideoComposition: React.FC = () => {
  useFonts();
  const t = useTime();

  const layers = SCENES.map((scene, i) => {
    const next = SCENES[i + 1];
    const inDur = transitionDuration(scene.transition);
    const end = next ? next.start + transitionDuration(next.transition) : AUDIO_DURATION + 1;
    if (t < scene.start || t >= end) return null;
    const inP = inDur > 0 ? clamp((t - scene.start) / inDur) : 1;
    const outP = next && transitionDuration(next.transition) > 0 ? clamp((t - next.start) / transitionDuration(next.transition)) : 0;
    const inStyle = inP < 1 ? incomingStyle(scene.transition, inP) : {};
    const outStyle = outgoingStyle(next?.transition, outP);
    const filters = [inStyle.filter, outStyle.filter].filter(Boolean).join(' ');
    const Scene = SCENE_COMPONENTS[scene.id];
    return (
      <AbsoluteFill key={scene.id} style={{...outStyle, ...inStyle, filter: filters || undefined, willChange: 'transform'}}>
        <Scene t={t} />
      </AbsoluteFill>
    );
  });

  const accents = SCENES.map((scene) => {
    const d = transitionDuration(scene.transition);
    if (d <= 0) return null;
    const p = (t - scene.start) / d;
    return <TransitionAccent key={scene.id} tr={scene.transition} p={p} />;
  });

  const endFade = ramp(t, CUES.endFade[0], CUES.endFade[1]);

  return (
    <AbsoluteFill style={{background: palette.midnight, overflow: 'hidden'}}>
      {layers}
      {accents}
      <FilmFinish />
      <AbsoluteFill style={{background: '#000', opacity: endFade}} />
      <Audio
        src={staticFile(AUDIO_FILE)}
        volume={(f) => 1 - ramp(f / FPS, AUDIO_DURATION - effects.audioFadeOutSeconds, AUDIO_DURATION)}
      />
    </AbsoluteFill>
  );
};
