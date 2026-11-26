import { describe, expect, it } from 'vitest';
import src from './platform.ts?raw';

describe('sound after switching apps', () => {
  it('opens fresh sound on a gesture iPhone accepts (finger up, click, key), never on touching down', () => {
    const m = src.match(/for \(const ev of \[([^\]]+)\]\) document\.addEventListener\(ev, wakeOnTouch/);
    expect(m).toBeTruthy();
    expect(m![1]).not.toMatch(/pointerdown|touchstart/);
    expect(m![1]).toMatch(/touchend/);
    expect(m![1]).toMatch(/click/);
  });
});
