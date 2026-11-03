# WordFlow

PWA in Hebrew for learning English vocabulary and spelling. Progress stays on the device.

- Daily session: warm-up on known words, short boost on weak words, then new words.
- Recognition and spelling are two independent measures. Only recognition limits how fast new words arrive.
- Before a new word is taught she can say she knows it. If she proves it, another word takes its place in the same round.
- She can run extra rounds of new words in a day. The recognition gate still applies.
- Sentence practice in `src/sentences.ts`, preferring sentences made only of words she knows.
- 480 words in 8 levels, A1 to B2, in `src/words.ts`. Learning rules are in `src/engine.ts`.

`npm test` · `npm run dev` · `npm run build`. Pushing to `main` deploys to GitHub Pages.
