// The offer after learning: the hearts that came in, and a choice between a game and more learning.
// It lives in its own root on top of any course, so every course shows the same offer.
import { useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import './users.css';
import { GameScreen } from './game';
import { MAX_HEARTS, onHearts } from './hearts';

let root: Root | null = null;

function Offer({ gained, n, onClose }: { gained: number; n: number; onClose: () => void }) {
  const [playing, setPlaying] = useState(false);
  if (playing) return <GameScreen onClose={onClose} />;
  return (
    <div className="cs-wrap" onClick={onClose}>
      <div className="cs-sheet hearts-offer" role="dialog" aria-label="לבבות למשחק" onClick={(e) => e.stopPropagation()}>
        {gained > 0 && <h2>קיבלת {gained} {gained === 1 ? 'לב' : 'לבבות'}!</h2>}
        <div className="hearts-row" aria-label={`${n} מתוך ${MAX_HEARTS} לבבות`}>
          {Array.from({ length: MAX_HEARTS }, (_, i) => <span key={i} className={i < n ? 'on' : ''}>{i < n ? '❤️' : '🤍'}</span>)}
        </div>
        <p className="cs-note">כל משחק עולה לב אחד.</p>
        {n > 0 && <button type="button" className="fam-open" onClick={() => setPlaying(true)}>לשחק</button>}
        <button type="button" className="cs-link" onClick={onClose}>להמשיך ללמוד</button>
      </div>
    </div>
  );
}

export function showOffer(gained: number, n: number) {
  if (!root) {
    const el = document.createElement('div');
    el.id = 'hearts-offer';
    document.body.appendChild(el);
    root = createRoot(el);
  }
  root.render(<Offer key={Date.now()} gained={gained} n={n} onClose={() => root?.render(null)} />);
}

onHearts(showOffer);
