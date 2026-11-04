import { useEffect, useRef, useState } from 'react';
import { InputState, NoteEvent, noteInput } from '../audio/input';
import { useApp } from '../state/store';

let users = 0;
let stopTimer: number | undefined;

/**
 * Listens to a real piano (microphone) or MIDI keyboard while the screen is open, when the learner chose
 * "real keyboard" in settings. The microphone is released shortly after the last listening screen closes.
 */
export function useExternalNotes(active: boolean, onNote: (midi: number, e: NoteEvent) => void): { enabled: boolean; state: InputState } {
  const { settings } = useApp();
  const enabled = settings.input === 'external' && active;
  const cb = useRef(onNote);
  cb.current = onNote;
  const [state, setState] = useState<InputState>(noteInput.state);

  useEffect(() => {
    if (!enabled) return;
    users++;
    window.clearTimeout(stopTimer);
    void noteInput.start();
    const offS = noteInput.onState(setState);
    const offN = noteInput.onNote((e) => cb.current(e.midi, e));
    setState(noteInput.state);
    return () => {
      offS();
      offN();
      users--;
      if (users <= 0) stopTimer = window.setTimeout(() => { if (users <= 0) noteInput.stop(); }, 4000);
    };
  }, [enabled]);

  return { enabled, state };
}
