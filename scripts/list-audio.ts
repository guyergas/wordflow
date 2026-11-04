// Prints the recordings the app needs, for scripts/gen-audio.py.
import { HEBREW_AUDIO } from '../src/alef/letters';
import { audioName, THAI_AUDIO } from '../src/thai';

console.log(JSON.stringify([
  ...THAI_AUDIO.map((a) => ({ th: a.th, name: audioName(a.th), dir: 'th', voice: 'th-TH-NiwatNeural' })),
  ...HEBREW_AUDIO.map((t) => ({ th: t, name: audioName(t), dir: 'he', voice: 'he-IL-HilaNeural' })),
]));
