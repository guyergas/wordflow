// Multi-bar notation (4/4): melodies and rhythms. VexFlow formats each bar; colors come from theme tokens.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import VexFlow, {
  Accidental as VfAccidental, Annotation, AnnotationVerticalJustify, Beam, Dot, Formatter, Renderer, Stave, StaveNote, Voice,
} from 'vexflow/bravura';
import { vexDuration } from '../engine/rhythm';
import { Accidental, accidentalSign, Clef, KeySig, Pitch, vexKey } from '../music/pitch';

export type ScoreRole = 'normal' | 'current' | 'done' | 'good' | 'bad' | 'warn' | 'hidden';

export interface ScoreNote {
  /** null = rest */
  pitch: Pitch | null;
  beats: number;
  role?: ScoreRole;
  /** Finger number printed above the note. */
  finger?: number;
}

export interface ScoreProps {
  clef: Clef | 'percussion';
  /** Bars to draw on this line, each summing to 4 beats. */
  bars: ScoreNote[][];
  scale?: number;
  showTime?: boolean;
  beams?: boolean;
  /** x centre (px) of every note on the line, in order. */
  onLayout?: (xs: number[]) => void;
  ariaLabel?: string;
  keySig?: KeySig;
}

function cssVar(el: HTMLElement, name: string, fallback: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

const UNIT_H = 128;

export function Score({ clef, bars, scale = 1.3, showTime = true, beams = true, onLayout, ariaLabel, keySig }: ScoreProps) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    VexFlow.setFonts('Bravura', 'Academico');
    document.fonts.load('30px Bravura').catch(() => undefined).finally(() => setReady(true));
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const bump = () => setTick((t) => t + 1);
    mq.addEventListener('change', bump);
    const obs = new MutationObserver(bump);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { mq.removeEventListener('change', bump); obs.disconnect(); };
  }, []);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const key = (keySig ?? '') + JSON.stringify(bars.map((b) => b.map((n) => [n.pitch ? vexKey(n.pitch) : 'r', n.beats, n.role ?? '', n.finger ?? 0])));

  useLayoutEffect(() => {
    const el = box.current;
    if (!el || !ready || width < 50) return;
    el.querySelector('svg')?.remove();
    const ink = cssVar(el, '--staff-ink', '#1c1b1a');
    const colors: Record<ScoreRole, string> = {
      normal: ink,
      current: cssVar(el, '--note-current', '#a9781f'),
      done: cssVar(el, '--ink-3', '#8f897d'),
      good: cssVar(el, '--good', '#2c8a57'),
      bad: cssVar(el, '--bad', '#c0493c'),
      warn: cssVar(el, '--gold', '#b8862b'),
      hidden: 'rgba(0,0,0,0)',
    };
    const renderer = new Renderer(el as HTMLDivElement, Renderer.Backends.SVG);
    renderer.resize(width, Math.round(UNIT_H * scale));
    const ctx = renderer.getContext();
    ctx.scale(scale, scale);
    ctx.setFillStyle(ink);
    ctx.setStrokeStyle(ink);

    const w = width / scale - 4;
    const head = clef === 'percussion' ? 30 : 42;
    const keyW = keySig && keySig !== 'C' && clef !== 'percussion' ? (keySig === 'D' || keySig === 'Bb' ? 26 : 16) : 0;
    const timeW = (showTime ? 26 : 0) + keyW;
    const bw = (w - head - timeW) / Math.max(1, bars.length);
    const vfClef = clef === 'percussion' ? 'percussion' : clef;
    const restKey = clef === 'bass' ? 'd/3' : 'b/4';
    const xs: number[] = [];
    let x = 2;
    bars.forEach((bar, i) => {
      const first = i === 0;
      const stave = new Stave(x, 4, first ? bw + head + timeW : bw);
      if (first) {
        stave.addClef(vfClef);
        if (keyW) stave.addKeySignature(keySig!);
        if (showTime) stave.addTimeSignature('4/4');
      }
      stave.setStyle({ fillStyle: ink, strokeStyle: ink });
      stave.setContext(ctx).draw();
      x += first ? bw + head + timeW : bw;

      const held = new Map<string, Accidental>();
      const notes = bar.map((n) => {
        const { d, dots } = vexDuration(n.beats);
        const rest = !n.pitch;
        const keys = rest ? [restKey] : clef === 'percussion' ? ['b/4'] : [vexKey(n.pitch!)];
        const sn = new StaveNote({ keys, duration: d + (rest ? 'r' : ''), clef: vfClef, autoStem: !rest });
        if (dots) Dot.buildAndAttach([sn], { all: true });
        if (n.pitch && clef !== 'percussion') {
          const sign = accidentalSign(n.pitch, keySig, held);
          if (sign) sn.addModifier(new VfAccidental(sign), 0);
        }
        if (n.finger && n.pitch) {
          const an = new Annotation(String(n.finger)).setVerticalJustification(AnnotationVerticalJustify.TOP);
          an.setFont('Rubik, sans-serif', 12, 'bold');
          sn.addModifier(an, 0);
        }
        const c = colors[n.role ?? 'normal'];
        sn.setStyle({ fillStyle: c, strokeStyle: c });
        sn.setLedgerLineStyle({ fillStyle: n.role === 'hidden' ? c : ink, strokeStyle: n.role === 'hidden' ? c : ink, lineWidth: 1.4 });
        return sn;
      });
      if (!notes.length) return;
      const voice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT);
      voice.addTickables(notes);
      const bms = beams ? Beam.generateBeams(notes.filter((n) => !n.isRest())) : [];
      new Formatter().joinVoices([voice]).format([voice], Math.max(30, stave.getNoteEndX() - stave.getNoteStartX() - 12));
      voice.draw(ctx, stave);
      bms.forEach((b, j) => {
        // A beam takes the color of its notes (hidden notes stay hidden).
        const first = b.getNotes()[0];
        const idx = notes.indexOf(first as StaveNote);
        const role = bar[idx]?.role ?? 'normal';
        b.setStyle({ fillStyle: colors[role], strokeStyle: colors[role] });
        b.setContext(ctx).draw();
        void j;
      });
      notes.forEach((sn) => xs.push((sn.getAbsoluteX() + 6) * scale));
    });
    onLayout?.(xs);
    const svg = el.querySelector('svg');
    if (svg) {
      svg.setAttribute('role', 'img');
      if (ariaLabel) svg.setAttribute('aria-label', ariaLabel);
      svg.style.direction = 'ltr';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, width, clef, key, scale, showTime, beams, tick, keySig]);

  return <div ref={box} className="staff" dir="ltr" style={{ height: Math.round(UNIT_H * scale) }} />;
}
