// A reward game, a stand-alone page in public/game. It opens after learning (hearts, see hearts.ts) and from the settings.
// The game saves under the current user's keys (game.paperio, hearts), so each player has their own progress and it syncs.
// Parents play without hearts.
import { useEffect } from 'react';
import { IS_PARENT, USER_ID, USER_NAME } from './course';
import { pushProgress } from './progressSync';

export const gameUrl = (user: string | null, name: string, free = false) => {
  const q = new URLSearchParams();
  if (user) q.set('user', user);
  if (name) q.set('name', name);
  if (free) q.set('free', '1');
  // In the hash, not the query: the service worker serves precached pages only by their exact address.
  return `game/paperio.html#${q}`;
};

export function GameScreen({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const close = () => { pushProgress(); onClose(); };
    const onMsg = (e: MessageEvent) => { if (e.origin === location.origin && e.data?.type === 'wf-game-close') close(); };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [onClose]);
  return <iframe className="wf-game" title="משחק" src={gameUrl(USER_ID, USER_NAME, IS_PARENT || !USER_ID)} />;
}
