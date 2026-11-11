# Adding English grammar topics

Topics are in `src/grammar/topics.ts`. Each run adds one, the first in this list not yet there. The Ministry's official grammar bands could not be retrieved, so the order follows common A1 and A2 practice. `words` is how many known words the topic waits for, and it must not go down along the array, so insert each new topic at its place by `words` rather than at the end (the learner gets the first topic in the array not yet seen).

The tenses are already in, split into several topics each with plenty of practice: Present Progressive (`pp-form`, `pp-ing`, `pp-neg-q`, `ps-vs-pp`, words 300 to 340), Past Simple (`past-be`, `past-regular`, `past-irregular-1`, `past-irregular-2`, `past-neg-q`, `past-mix`, words 450 to 590) and the future (`will`, `will-neg-q`, `going-to`, `will-vs-going`, words 650 to 700). Present Perfect is left for later.

Basics: this/that/these/those (done); כינויי גוף: I, me, my; מילות יחס: in, on, at, under; there is / there are; ציווי; do ו־does בשאלה; don't ו־doesn't בשלילה, all with words 190 to 290, before Present Progressive; then can ו־can't, words 350 to 400.
Continuing, words 600 to 800: some ו־any; much ו־many; השוואה: bigger, the biggest, words 600 to 640, between Past Simple and will; then סדר מילים, words 720 to 800.
Advanced, words 850 to 1,200: Present Perfect; should ו־have to; תנאי ראשון; who/which; adverbs: quick, quickly; passive פשוט.

Each topic: `rule` of one or two short Hebrew sentences, `example` in English, and at least 10 questions in the form `[sentence with ___, right, [wrong, ...], why]`. Why is one short Hebrew sentence. Sentences are fit for a child and use common words. Run `npx vitest run src/grammar`.
