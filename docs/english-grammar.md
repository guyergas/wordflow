# Adding English grammar topics

Topics are in `src/grammar/topics.ts`. Each run adds one, the first in this list not yet there. The Ministry's official grammar bands could not be retrieved, so the order follows common A1 and A2 practice. `words` is how many known words the topic waits for, and it must not go down.

Basics, words 180 to 400: this/that/these/those; כינויי גוף: I, me, my; מילות יחס: in, on, at, under; there is / there are; ציווי; do ו־does בשאלה; don't ו־doesn't בשלילה; Present Progressive; Present Simple מול Present Progressive; can ו־can't.
Continuing, words 450 to 800: Past Simple של to be; Past Simple בפעלים רגילים; Past Simple בפעלים לא סדירים; שאלה ושלילה בעבר; some ו־any; much ו־many; השוואה: bigger, the biggest; will; going to; סדר מילים.
Advanced, words 850 to 1,200: Present Perfect; should ו־have to; תנאי ראשון; who/which; adverbs: quick, quickly; passive פשוט.

Each topic: `rule` of one or two short Hebrew sentences, `example` in English, and at least 10 questions in the form `[sentence with ___, right, [wrong, ...], why]`. Why is one short Hebrew sentence. Sentences are fit for a child and use common words. Run `npx vitest run src/grammar`.
