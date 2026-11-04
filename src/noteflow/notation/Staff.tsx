// Notation Renderer — draws with VexFlow (Bravura font bundled for offline use).
// Rendering only: it receives pitches from the music model and never decides answers.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import VexFlow, { Annotation, AnnotationVerticalJustify, BarlineType, Formatter, Renderer, Stave, StaveNote, Voice, Accidental as VfAccidental } from 'vexflow/bravura';
import { accidentalSign, Clef, KeySig, Pitch, vexKey } from '../music/pitch';

export interface StaffNote {
  pitch: Pitch;
  /** 'target' | 'ghost' (hint anchor) | 'correct' | 'wrong' */
  role?: 'target' | 'ghost' | 'correct' | 'wrong';
  /** Finger number printed above the note. */
  finger?: number;
}

let fontsReady: Promise<void> | null = null;
function ensureFonts(): Promise<void> {
  if (!fontsReady) {
    fontsReady = (async () => {
      try {
        // The 'vexflow/bravura' entry registers the embedded fonts itself (no network).
        VexFlow.setFonts('Bravura', 'Academico');
        await document.fonts.load('30px Bravura');
      } catch { /* render anyway */ }
    })();
  }
  return fontsReady;
}

function cssVar(el: HTMLElement, name: string, fallback: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

const UNIT_H = 132; // unscaled drawing height: room for 3 ledger lines above and below

export interface StaffProps {
  clef: Clef;
  notes: StaffNote[];
  /** Visual scale; staff line gap = 10 * scale px. */
  scale?: number;
  /** Reports the x (px, relative to the staff box) of each note, for overlays. */
  onLayout?: (xs: number[]) => void;
  ariaLabel?: string;
  keySig?: KeySig;
}

export function Staff({ clef, notes, scale = 1.6, onLayout, ariaLabel, keySig }: StaffProps) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => { ensureFonts().then(() => setReady(true)); }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const bump = () => setThemeTick((t) => t + 1);
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

  const key = `${keySig ?? ''}#` + notes.map((n) => `${vexKey(n.pitch)}:${n.role ?? ''}:${n.finger ?? ''}`).join('|');

  useLayoutEffect(() => {
    const el = box.current;
    if (!el || !ready || width < 50) return;
    el.querySelector('svg')?.remove();

    const ink = cssVar(el, '--staff-ink', '#1c1b1a');
    const colors: Record<NonNullable<StaffNote['role']>, string> = {
      target: cssVar(el, '--note-target', ink),
      ghost: cssVar(el, '--note-ghost', '#9a958c'),
      correct: cssVar(el, '--good', '#2f8f5b'),
      wrong: cssVar(el, '--bad', '#c4473a'),
    };

    const renderer = new Renderer(el as HTMLDivElement, Renderer.Backends.SVG);
    renderer.resize(width, Math.round(UNIT_H * scale));
    const ctx = renderer.getContext();
    ctx.scale(scale, scale);
    ctx.setFillStyle(ink);
    ctx.setStrokeStyle(ink);

    const w = width / scale;
    const stave = new Stave(2, 6, w - 4);
    // Open-ended lines: a single note is not a bar, so no barlines at either end.
    stave.setBegBarType(BarlineType.NONE);
    stave.setEndBarType(BarlineType.NONE);
    stave.addClef(clef);
    if (keySig && keySig !== 'C') stave.addKeySignature(keySig);
    stave.setStyle({ fillStyle: ink, strokeStyle: ink });
    stave.setContext(ctx).draw();

    const svs = notes.map((n) => {
      const sn = new StaveNote({ keys: [vexKey(n.pitch)], duration: 'w', clef, alignCenter: notes.length === 1 });
      // Separate whole notes: each one is read on its own (no carry-over between them).
      const sign = accidentalSign(n.pitch, keySig);
      if (sign) sn.addModifier(new VfAccidental(sign), 0);
      const c = colors[n.role ?? 'target'];
      sn.setStyle({ fillStyle: c, strokeStyle: c });
      sn.setLedgerLineStyle({ fillStyle: ink, strokeStyle: ink, lineWidth: 1.4 });
      if (n.finger) {
        const an = new Annotation(String(n.finger)).setVerticalJustification(AnnotationVerticalJustify.TOP);
        an.setFont('Rubik, sans-serif', 13, 'bold');
        sn.addModifier(an, 0);
      }
      return sn;
    });
    if (svs.length) {
      const voice = new Voice({ numBeats: 4 * svs.length, beatValue: 4 }).setMode(Voice.Mode.SOFT);
      voice.addTickables(svs);
      const avail = stave.getNoteEndX() - stave.getNoteStartX() - 10;
      new Formatter().joinVoices([voice]).format([voice], avail);
      voice.draw(ctx, stave);
      onLayout?.(svs.map((s) => (s.getAbsoluteX() + 8) * scale));
    }
    const svg = el.querySelector('svg');
    if (svg) {
      svg.setAttribute('role', 'img');
      if (ariaLabel) svg.setAttribute('aria-label', ariaLabel);
      svg.style.direction = 'ltr';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, width, clef, key, scale, themeTick]);

  return <div ref={box} className="staff" dir="ltr" style={{ height: Math.round(UNIT_H * scale) }} />;
}
