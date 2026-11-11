// Prints the recordings the app needs, for scripts/gen-audio.py.
import { HEBREW_AUDIO } from '../src/alef/letters';
import { TINY_EN_AUDIO, TINY_HE_AUDIO } from '../src/tinyen/letters';
import { TOTS_AUDIO } from '../src/tots/numbers';
import { WORDS_EN_AUDIO, WORDS_HE_AUDIO } from '../src/littleWords/data';
import { audioName, THAI_AUDIO } from '../src/thai';
import { forSpeech, recordingName } from '../src/speech';

console.log(JSON.stringify([
  ...THAI_AUDIO.map((a) => ({ th: a.th, name: audioName(a.th), dir: 'th', voice: 'th-TH-NiwatNeural' })),
  ...[...new Set([...HEBREW_AUDIO, ...TOTS_AUDIO, ...TINY_HE_AUDIO, ...WORDS_HE_AUDIO])].map((t) => ({ th: forSpeech(t), name: recordingName(t, 'he'), dir: 'he', voice: 'he-IL-HilaNeural' }))
    // Different sentences can be read the same once niqqud is dropped; each recording is made once.
    .filter((x, i, all) => all.findIndex((y) => y.name === x.name) === i),
  ...[...new Set([...TINY_EN_AUDIO, ...WORDS_EN_AUDIO])].map((t) => ({ th: t, name: audioName(t), dir: 'en', voice: 'en-US-JennyNeural' })),
]));
