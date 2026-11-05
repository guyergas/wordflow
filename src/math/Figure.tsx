// The pictures: number lines, bars, grids and shapes. Math pictures always read left to right.
import { Fig } from './skills';

const INK = 'currentColor', SUN = 'var(--sun)', TILE = 'var(--tile)', LINE = 'var(--ink-3)', SOFT = 'var(--surface-2)', REC = 'var(--rec)';
const T = ({ x, y, s, size = 15, a = 'middle' }: { x: number; y: number; s: string; size?: number; a?: 'middle' | 'start' | 'end' }) => <text x={x} y={y} textAnchor={a} fontSize={size} fill={INK} style={{ fontFamily: 'var(--font-en)' }}>{s}</text>;

export function Figure({ fig }: { fig: Fig }) {
  const svg = (w: number, h: number, children: React.ReactNode, label: string) => <svg className="m-fig" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} style={{ direction: 'ltr' }}>{children}</svg>;
  switch (fig.t) {
    case 'line': {
      const W = 400, L = 16, span = (fig.to - fig.from) / fig.step, px = (v: number) => L + ((v - fig.from) / (fig.to - fig.from)) * (W - 2 * L);
      const ticks = Array.from({ length: span + 1 }, (_, i) => fig.from + i * fig.step);
      const end = fig.start !== undefined && fig.jump !== undefined ? fig.start + fig.jump : null;
      return svg(W, 92, <>
        <line x1={L} y1={58} x2={W - L} y2={58} stroke={INK} strokeWidth={2} />
        {ticks.map((v) => <g key={v}><line x1={px(v)} y1={v % 5 === 0 ? 50 : 54} x2={px(v)} y2={v % 5 === 0 ? 66 : 62} stroke={INK} strokeWidth={v % 5 === 0 ? 2 : 1} />{v % 5 === 0 && <T x={px(v)} y={84} s={String(v)} />}</g>)}
        {fig.start !== undefined && <circle cx={px(fig.start)} cy={58} r={6} fill={REC} />}
        {end !== null && <path d={`M${px(fig.start!)} 50 Q${(px(fig.start!) + px(end)) / 2} ${Math.max(4, 44 - Math.abs(fig.jump!) * 3)} ${px(end)} 50`} fill="none" stroke={REC} strokeWidth={2.5} strokeDasharray="5 4" />}
      </>, 'ציר מספרים');
    }
    case 'fracline': {
      const W = 400, L = 24, px = (i: number) => L + (i / fig.den) * (W - 2 * L);
      return svg(W, 80, <>
        <line x1={L} y1={36} x2={W - L} y2={36} stroke={INK} strokeWidth={2} />
        {Array.from({ length: fig.den + 1 }, (_, i) => <line key={i} x1={px(i)} y1={i % fig.den === 0 ? 26 : 29} x2={px(i)} y2={i % fig.den === 0 ? 46 : 43} stroke={INK} strokeWidth={i % fig.den === 0 ? 2.5 : 1.5} />)}
        <T x={px(0)} y={68} s="0" size={18} /><T x={px(fig.den)} y={68} s="1" size={18} />
        <circle cx={px(fig.mark)} cy={36} r={8} fill={SUN} stroke={INK} strokeWidth={1.5} />
      </>, 'שבר מסומן על ציר');
    }
    case 'bar': {
      const W = 400, w = (W - 8) / fig.parts;
      return svg(W, 72, Array.from({ length: fig.parts }, (_, i) => <rect key={i} x={4 + i * w} y={6} width={w} height={60} fill={i < fig.shaded ? SUN : SOFT} stroke={INK} strokeWidth={1.5} />), `פס מחולק ל־${fig.parts} חלקים, ${fig.shaded} צבועים`);
    }
    case 'array': {
      const g = 34, W = fig.cols * g + 8, H = fig.rows * g + 8;
      return svg(W, H, Array.from({ length: fig.rows * fig.cols }, (_, i) => <circle key={i} cx={4 + (i % fig.cols) * g + g / 2} cy={4 + Math.floor(i / fig.cols) * g + g / 2} r={11} fill={SUN} stroke={INK} strokeWidth={1} />), `${fig.rows} שורות של ${fig.cols} נקודות`);
    }
    case 'hundred': {
      const g = 20;
      return svg(204, 204, Array.from({ length: 100 }, (_, i) => <rect key={i} x={2 + (i % 10) * g} y={2 + Math.floor(i / 10) * g} width={g} height={g} fill={i < fig.shaded ? SUN : 'none'} stroke={LINE} strokeWidth={1} />), `לוח של מאה משבצות, ${fig.shaded} צבועות`);
    }
    case 'grid': {
      const g = 30, W = fig.w * g + 44, H = fig.h * g + 34;
      return svg(W, H, <>
        {Array.from({ length: fig.w * fig.h }, (_, i) => <rect key={i} x={36 + (i % fig.w) * g} y={4 + Math.floor(i / fig.w) * g} width={g} height={g} fill={TILE} stroke={INK} strokeWidth={1} />)}
        <T x={36 + (fig.w * g) / 2} y={fig.h * g + 26} s={`${fig.w} ס״מ`} /><T x={30} y={4 + (fig.h * g) / 2 + 5} s={`${fig.h} ס״מ`} a="end" size={13} />
      </>, `מלבן של ${fig.w} על ${fig.h} משבצות`);
    }
    case 'rect': {
      const k = Math.min(240 / fig.w, 120 / fig.h), w = fig.w * k, h = fig.h * k;
      return svg(w + 90, h + 44, <>
        <rect x={64} y={6} width={w} height={h} fill={TILE} stroke={INK} strokeWidth={2} />
        <T x={64 + w / 2} y={h + 30} s={`${fig.w} ${fig.unit}`} /><T x={56} y={6 + h / 2 + 5} s={`${fig.h} ${fig.unit}`} a="end" />
      </>, `מלבן ${fig.w} על ${fig.h} ${fig.unit}`);
    }
    case 'tri': {
      const k = Math.min(240 / fig.b, 120 / fig.h), w = fig.b * k, h = fig.h * k, top = 64 + w * 0.35;
      return svg(w + 90, h + 44, <>
        <polygon points={`64,${h + 6} ${64 + w},${h + 6} ${top},6`} fill={TILE} stroke={INK} strokeWidth={2} />
        <line x1={top} y1={6} x2={top} y2={h + 6} stroke={INK} strokeWidth={1.5} strokeDasharray="5 4" />
        <T x={64 + w / 2} y={h + 30} s={`${fig.b} ${fig.unit}`} /><T x={top + 6} y={6 + h / 2} s={`${fig.h} ${fig.unit}`} a="start" />
      </>, `משולש, בסיס ${fig.b} וגובה ${fig.h} ${fig.unit}`);
    }
    case 'lshape': {
      const k = Math.min(220 / fig.w, 140 / fig.h), w = fig.w * k, h = fig.h * k, cw = fig.cutW * k, ch = fig.cutH * k, L = 64;
      return svg(w + 130, h + 44, <>
        <polygon points={`${L},6 ${L + w - cw},6 ${L + w - cw},${6 + ch} ${L + w},${6 + ch} ${L + w},${6 + h} ${L},${6 + h}`} fill={TILE} stroke={INK} strokeWidth={2} />
        <T x={L + w / 2} y={h + 30} s={`${fig.w} ${fig.unit}`} /><T x={L - 8} y={6 + h / 2 + 5} s={`${fig.h} ${fig.unit}`} a="end" />
        <T x={L + w - cw / 2} y={ch - 2 > 18 ? ch - 2 : 18} s={`${fig.cutW}`} size={14} /><T x={L + w + 6} y={6 + ch / 2 + 5} s={`${fig.cutH} ${fig.unit}`} a="start" size={14} />
      </>, `מלבן ${fig.w} על ${fig.h} ${fig.unit} שחסרה לו פינה ${fig.cutW} על ${fig.cutH}`);
    }
    case 'chart': {
      const W = 400, H = 210, L = 40, B = 178, T0 = 12, top = Math.max(...fig.bars.map((b) => b.value)), max = Math.ceil(top / fig.step) * fig.step, y = (v: number) => B - (v / max) * (B - T0), slot = (W - L - 8) / fig.bars.length;
      return svg(W, H, <>
        {Array.from({ length: max / fig.step + 1 }, (_, i) => i * fig.step).map((v) => <g key={v}><line x1={L} x2={W - 8} y1={y(v)} y2={y(v)} stroke={LINE} strokeWidth={v ? .7 : 1.6} /><T x={L - 8} y={y(v) + 5} s={String(v)} size={13} a="end" /></g>)}
        {fig.bars.map((b, i) => <g key={b.label}><rect x={L + slot * i + slot * .2} y={y(b.value)} width={slot * .6} height={B - y(b.value)} fill={SUN} stroke={INK} strokeWidth={1} rx={3} /><T x={L + slot * (i + .5)} y={B + 22} s={b.label} size={14} /></g>)}
      </>, 'גרף עמודות');
    }
    case 'box': {
      const k = 16, w = fig.a * k, h = fig.c * k, d = fig.b * k * 0.55, L = 64, top = 6 + d;
      return svg(w + d + 130, h + d + 44, <>
        <polygon points={`${L},${top} ${L + w},${top} ${L + w + d},${top - d} ${L + d},${top - d}`} fill={SOFT} stroke={INK} strokeWidth={2} />
        <polygon points={`${L + w},${top} ${L + w + d},${top - d} ${L + w + d},${top - d + h} ${L + w},${top + h}`} fill={SUN} stroke={INK} strokeWidth={2} />
        <rect x={L} y={top} width={w} height={h} fill={TILE} stroke={INK} strokeWidth={2} />
        <T x={L + w / 2} y={top + h + 24} s={`${fig.a} ${fig.unit}`} /><T x={L - 8} y={top + h / 2 + 5} s={`${fig.c} ${fig.unit}`} a="end" />
        <T x={L + w + d + 6} y={top + h - d / 2 - 6} s={`${fig.b} ${fig.unit}`} a="start" />
      </>, `תיבה ${fig.a} על ${fig.b} על ${fig.c} ${fig.unit}`);
    }
  }
}
