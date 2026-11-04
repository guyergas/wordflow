import { audio } from '../../audio/engine';
import { Lesson } from '../../engine/lessons';
import { onsetsOf, parseBar } from '../../engine/rhythm';
import { midi, parsePitch, pitchName } from '../../music/pitch';
import { Score } from '../../notation/Score';
import { Staff } from '../../notation/Staff';
import { Icon } from './ui';
import { useState } from 'react';
import type { Clef, KeySig } from '../../music/pitch';
import { fingerFor } from '../../engine/fingers';
import { HandPad } from './HandPad';

function LabeledStaff({ clef, notes, labels, keySig, fingers }: { clef: Clef; notes: string[]; labels?: boolean; keySig?: KeySig; fingers?: boolean }) {
  const [xs, setXs] = useState<number[]>([]);
  return (
    <div style={{ position: 'relative', paddingBottom: labels ? 20 : 0 }}>
      <Staff clef={clef} scale={1.15} onLayout={setXs} keySig={keySig}
        notes={notes.map((n) => ({ pitch: parsePitch(n), role: 'target', finger: fingers ? fingerFor(parsePitch(n), clef) ?? undefined : undefined }))} />
      {labels && xs.map((x, i) => (
        <span key={i} className="lesson-label" style={{ left: x + 4 }}>{pitchName(parsePitch(notes[i]))}</span>
      ))}
    </div>
  );
}

export function LessonModal({ lesson, onGo, onClose, goLabel = 'הבנתי, מתחילים' }: {
  lesson: Lesson; onGo?: () => void; onClose: () => void; goLabel?: string;
}) {
  const play = () => {
    audio.unlock();
    if (lesson.rhythm) {
      const ctx = audio.context;
      if (!ctx) return;
      audio.cancelScheduled();
      const beat = 60 / 72;
      let t = ctx.currentTime + 0.15;
      for (const bar of lesson.rhythm) {
        const ev = parseBar(bar);
        const { onsets } = onsetsOf(ev, beat);
        for (let i = 0; i < 4; i++) audio.click(t + i * beat, i === 0, 0.6);
        onsets.forEach((o) => audio.tok(t + o.time, ev[o.index].beats, beat));
        t += 4 * beat;
      }
      return;
    }
    const notes = (lesson.example ?? []).flatMap((e) => e.notes);
    audio.playSequence(notes.map((n) => ({ midi: midi(parsePitch(n)), beats: 1 })), { gapSec: 0.5 });
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet lesson" role="dialog" aria-modal="true" aria-label={lesson.title} onClick={(e) => e.stopPropagation()}>
        <div className="eyebrow" style={{ margin: 0 }}>רעיון אחד קטן</div>
        <h2 style={{ fontSize: 21, marginTop: 6 }}>{lesson.title}</h2>
        <div className="lesson-art">
          {lesson.example?.map((ex, i) => (
            <LabeledStaff key={i} clef={ex.clef} notes={ex.notes} labels={ex.labels} keySig={ex.key} fingers={ex.fingers} />
          ))}
          {lesson.hand && <HandPad hand={lesson.hand} />}
          {lesson.rhythm && (
            <Score clef="percussion" scale={1.05} bars={lesson.rhythm.map((b) => parseBar(b).map((e) => ({ pitch: e.rest ? null : { letter: 'B' as const, octave: 4, accidental: 0 as const }, beats: e.beats })))} />
          )}
        </div>
        <div className="stack" style={{ marginTop: 8 }}>{lesson.text.map((t) => <p key={t} style={{ margin: 0 }}>{t}</p>)}</div>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn" onClick={play}><Icon name="sound" size={16} />השמעה</button>
          {onGo ? <button className="btn primary grow" onClick={onGo}>{goLabel}</button> : <button className="btn primary grow" onClick={onClose}>סגירה</button>}
        </div>
      </div>
    </div>
  );
}
