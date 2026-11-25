import { describe, expect, it } from 'vitest';
import html from '../index.html?raw';
import main from './main.tsx?raw';

describe('no zooming', () => {
  it('the viewport and the gesture blocking are in place', () => {
    expect(html).toMatch(/name="viewport"[^>]*maximum-scale=1[^>]*user-scalable=no/);
    expect(main).toMatch(/blockZoom\(\);/);
  });
});
