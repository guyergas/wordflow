# Adding English reading texts

Texts are in `PASSAGES` in `src/englishReading.tsx`, in the order they open. The goal is a path of texts that grows slowly, in length and difficulty, up to what a ninth-grader reads (the Ministry's Band II, about the level of an unseen text in the 3-point bagrut).

Each run adds one text at the end of `PASSAGES`. It is one step longer or harder than the last text, never easier, following this ladder:

| Grade | Words in the text | Questions | Kind of text |
|---|---|---|---|
| ד-ה | 45 to 70 | 3 | simple present, everyday topics |
| ו | 70 to 120 | 4 to 5 | short stories and facts, simple past |
| ז | 120 to 180 | 5 to 6 | facts and stories, passive and comparisons |
| ח | 180 to 250 | 6 | opinion and information, more than one point of view |
| ט | 250 to 400 | 6 to 7 | articles and stories with questions on the main idea, the writer's opinion and what a line means |

Stay on a grade for about five texts before moving up. When a grade has enough texts, the next text moves to the next grade. Once the ט range is full (about 400 words), keep adding ט texts of 300 to 400 words on new topics.

Each text needs:

- `id`: short and unique. `title`: in English.
- `grade`: one of ד, ה, ו, ז, ח, ט, never lower than the text before.
- `words`: how many solid words it waits for, always more than the text before (about 100 more each time).
- `text`: original writing, not copied from anywhere. It must be fit for a child, with topics like nature, science, history, technology, people, everyday life and stories. Use words and grammar that fit the grade. Keep Present Perfect out for now.
- `qs`: `[question, right, [wrong, wrong]]`, all in Hebrew. At higher grades, ask about the main idea, the writer's opinion and what a line means, not only about details. Only one answer may be right according to the text.

Run `npx vitest run src/englishReading.test.ts`.
