# WordFlow

האתר: https://guyergas.github.io/wordflow/

PWA in Hebrew for learning English vocabulary and spelling, or everyday Thai. Each device picks a language, and each language keeps its own progress on the device.

Thai mode (`src/thai.ts`) shows Latin transliteration with tone marks, has no spelling practice, and plays recordings from `public/audio/th`. The deploy workflow creates missing recordings and commits them. The app falls back to the phone's Thai voice when a recording is missing.

- Daily session: warm-up on known words, short boost on weak words, then new words.
- Recognition and spelling are two independent measures. Only recognition limits how fast new words arrive.
- Before a new word is taught she can say she knows it. If she proves it, another word takes its place in the same round.
- She can run extra rounds of new words in a day. The recognition gate still applies.
- Sentence practice in `src/sentences.ts`, preferring sentences made only of words she knows.
- 690 words in 12 levels, A1 to C1, in `src/words.ts`. Learning rules are in `src/engine.ts`.

Math (`src/math`) is a third course on the same site. Skills in `skills.ts` generate a fresh question each time, with stations 1-7 so far. `engine.ts` holds the rules: an opening run with a separate stopping point in each area, prerequisites, understanding and execution as two measures, and hints that show other numbers. A course is one line in `COURSES` in `src/course.ts`, and it then appears in the switcher and in the time summary (`src/summary.ts`).

Eight knowledge courses (`src/knowledge`) share one engine: a short text, questions on understanding, and key points in spaced review. Lessons are in `lessons.ts`.

The alef-bet course (`src/alef`) is for children who cannot read yet, so everything is spoken and shown. Each letter is built from a letter they know, out of small, big and giant lines (`letters.ts`). It is one course, and each child uses their own device, so progress stays separate. `ink.ts` judges finger writing, and `engine.ts` holds the rules. Warm-up (known letters) and boost (weakest letters) are free practice that brings no new letter and leaves stages unchanged. Recordings in `public/audio/he` are created by the deploy, and the phone's Hebrew voice is the fallback.

The summary tab in every course shows study time and new items across all courses, by day and week, against a weekly schedule of minutes per course.

`npm test` · `npm run dev` · `npm run build`. Pushing to `main` deploys to GitHub Pages.
