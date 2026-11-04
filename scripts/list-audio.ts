// Prints the recordings the app needs, for scripts/gen-audio.py.
import { audioName, THAI_AUDIO } from '../src/thai';

console.log(JSON.stringify(THAI_AUDIO.map((a) => ({ th: a.th, name: audioName(a.th) }))));
