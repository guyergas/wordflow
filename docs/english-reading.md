# English reading texts

The texts are in `PASSAGES` in `src/readingTexts.ts`, in the order they open: 59 texts that grow slowly in length and difficulty, from fourth grade up to ninth grade (the Ministry's Band II, about the level of an unseen text in the 3-point bagrut). Every text has `grade`, the school grade it fits, and `words`, how many solid words it waits for. Both always go up along the array.

## Each run: questions

Every text should have about 15 questions, and most still have 3 to 6. Run `npx tsx scripts/next-reading.ts`. It prints `high`: up to two of the first ten texts, which learners reach first. When none of those is left, it prints `low`: one later text. Bring each listed text to 15 questions, then stop. When `textsLeft` is 0, skip this step.

The questions on a text:

- Use the form `[question, right, [wrong, wrong]]`, all in Hebrew. Only one answer may be right according to the text, and a child who did not read the text must not be able to guess it.
- Cover the whole text in order, from the first line to the last. Ask about details, and from grade ז up also about the main idea, the reason for something, what a word or line means in context, and the writer's opinion or purpose. At grades ח and ט, about a third of the questions should need some thinking, not only finding a line.
- Keep all three options about the same length. The right answer must be the longest option in no more than about a third of a text's questions, and sometimes the shortest. When you add questions to a text, also fix its existing questions where the right answer gives itself away by length.
- Do not change the text itself, its `id`, `grade` or `words`.

Run `npx vitest run src/englishReading.test.ts`.

## New texts

When every text has 15 questions, new texts can be added at the end, one per run, only when Guy asks for more. A new text is ט level, 300 to 400 words, on a new topic, with `words` 38 more than the last text. It must be original writing, fit for a child, and keep Present Perfect out for now.
