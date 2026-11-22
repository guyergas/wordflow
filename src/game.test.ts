// Guards for the game page. It once opened as the app's own "loading" screen: the service worker gave index.html
// for any address it had not stored exactly, and a query string after paperio.html made the address different.
import { describe, expect, it } from 'vitest';
import { gameUrl } from './game';
import page from '../public/game/paperio.html?raw';
import config from '../vite.config.ts?raw';

const script = page.match(/<script>([\s\S]*)<\/script>/)![1];

describe('game', () => {
  it('opens the stored page exactly: the player goes in the hash, never in a query', () => {
    const url = gameUrl('ayala', 'איילה');
    expect(url.startsWith('game/paperio.html#')).toBe(true);
    expect(url).not.toContain('?');
    expect(new URLSearchParams(url.split('#')[1]).get('name')).toBe('איילה');
  });

  it('the page reads the player from the hash', () => {
    expect(script).toContain('location.hash');
    expect(script).not.toContain('location.search');
  });

  it('the service worker never answers the game with the app', () => {
    expect(config).toMatch(/navigateFallbackDenylist:\s*\[[^\]]*game/);
  });

  it('each player has their own save, under the synced user keys', () => {
    expect(script).toContain('`wordflow.u.${WF_USER}.game.paperio`');
  });

  it('the game script parses', () => {
    expect(() => new Function(script)).not.toThrow();
  });
});
