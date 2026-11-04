// Grand staff (piano system): treble and bass staves joined by a brace, both voices aligned beat by beat.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import VexFlow, {
  Accidental as VfAccidental, Annotation, AnnotationVerticalJustify, Beam, Dot, Formatter, Renderer, Stave, StaveConnector, StaveNote, Voice,
} from 'vexflow/bravura';
import { vexDuration } from '../engine/rhythm';
import { Accidental, accidentalSign, Clef, KeySig, vexKey } from '../music/pitch';
import type { ScoreNote, ScoreRole } from './Score';

export interface GrandBar {
  treble: ScoreNote[];
  bass: ScoreNote[];
}

function cssVar(el: HTMLElement, name: string, fallback: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

const UNIT_H = 236;
const BASS_Y = 104;

export function GrandScore({ bars, scale = 1.2, showTime = true, keySig, ariaLabel }: {
  bars: GrandBar[]; scale?: number; showTime?: boolean; keySig?: KeySig; ariaLabel?: string;
}) {
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
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-contrast'] });
    return () => { mq.removeEventListener('change', bump); obs.disconnect(); };
  }, []);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const key = (keySig ?? '') + JSON.stringify(bars.map((b) => [b.treble, b.bass].map((v) => v.map((n) => [n.pitch ? vexKey(n.pitch) : 'r', n.beats, n.role ?? '', n.finger ?? 0]))));

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

    const left = 14; // room for the brace
    const w = width / scale - left - 4;
    const keyW = keySig && keySig !== 'C' ? (keySig === 'D' || keySig === 'Bb' ? 26 : 16) : 0;
    const head = 42 + keyW + (showTime ? 26 : 0);
    const bw = (w - head) / Math.max(1, bars.length);
    let x = left;

    const build = (bar: ScoreNote[], clef: Clef) => {
      const held = new Map<string, Accidental>();
      const restKey = clef === 'bass' ? 'd/3' : 'b/4';
      return bar.map((n) => {
        const { d, dots } = vexDuration(n.beats);
        const rest = !n.pitch;
        const sn = new StaveNote({ keys: rest ? [restKey] : [vexKey(n.pitch!)], duration: d + (rest ? 'r' : ''), clef, autoStem: !rest });
        if (dots) Dot.buildAndAttach([sn], { all: true });
        if (n.pitch) {
          const sign = accidentalSign(n.pitch, keySig, held);
          if (sign) sn.addModifier(new VfAccidental(sign), 0);
        }
        if (n.finger && n.pitch) {
          const an = new Annotation(String(n.finger)).setVerticalJustification(clef === 'treble' ? AnnotationVerticalJustify.TOP : AnnotationVerticalJustify.BOTTOM);
          an.setFont('Rubik, sans-serif', 12, 'bold');
          sn.addModifier(an, 0);
        }
        const c = colors[n.role ?? 'normal'];
        sn.setStyle({ fillStyle: c, strokeStyle: c });
        sn.setLedgerLineStyle({ fillStyle: n.role === 'hidden' ? c : ink, strokeStyle: n.role === 'hidden' ? c : ink, lineWidth: 1.4 });
        return sn;
      });
    };

    bars.forEach((bar, i) => {
      const first = i === 0;
      const sw = first ? bw + head : bw;
      const top = new Stave(x, 0, sw);
      const bottom = new Stave(x, BASS_Y, sw);
      if (first) {
        top.addClef('treble');
        bottom.addClef('bass');
        if (keyW) { top.addKeySignature(keySig!); bottom.addKeySignature(keySig!); }
        if (showTime) { top.addTimeSignature('4/4'); bottom.addTimeSignature('4/4'); }
      }
      for (const st of [top, bottom]) { st.setStyle({ fillStyle: ink, strokeStyle: ink }); st.setContext(ctx).draw(); }
      const connectors: StaveConnector[] = [new StaveConnector(top, bottom).setType(i === bars.length - 1 ? 'singleRight' : 'singleRight')];
      if (first) {
        connectors.push(new StaveConnector(top, bottom).setType('brace'));
        connectors.push(new StaveConnector(top, bottom).setType('singleLeft'));
      }
      for (const c of connectors) { c.setStyle({ fillStyle: ink, strokeStyle: ink }); c.setContext(ctx).draw(); }
      x += sw;

      const tn = build(bar.treble, 'treble');
      const bn = build(bar.bass, 'bass');
      const tv = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT).addTickables(tn);
      const bv = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT).addTickables(bn);
      tv.setStave(top);
      bv.setStave(bottom);
      const beams = [...Beam.generateBeams(tn.filter((n) => !n.isRest())), ...Beam.generateBeams(bn.filter((n) => !n.isRest()))];
      const fmt = new Formatter();
      fmt.joinVoices([tv]).joinVoices([bv]);
      fmt.format([tv, bv], Math.max(30, top.getNoteEndX() - top.getNoteStartX() - 12));
      tv.draw(ctx, top);
      bv.draw(ctx, bottom);
      for (const b of beams) {
        const n0 = b.getNotes()[0] as StaveNote;
        const ti = tn.indexOf(n0);
        const role = ti >= 0 ? bar.treble[ti]?.role : bar.bass[bn.indexOf(n0)]?.role;
        b.setStyle({ fillStyle: colors[role ?? 'normal'], strokeStyle: colors[role ?? 'normal'] });
        b.setContext(ctx).draw();
      }
    });
    const svg = el.querySelector('svg');
    if (svg) {
      svg.setAttribute('role', 'img');
      if (ariaLabel) svg.setAttribute('aria-label', ariaLabel);
      svg.style.direction = 'ltr';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, width, key, scale, showTime, tick]);

  return <div ref={box} className="staff grand" dir="ltr" style={{ height: Math.round(UNIT_H * scale) }} />;
}
