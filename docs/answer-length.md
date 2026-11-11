# Answer length in knowledge questions

In most knowledge questions the right answer was the longest option, so a child could pick it without reading. A lesson is listed when any right answer is clearly the longest (over 15% longer than every wrong one), or when the right answer is the longest, ties included, in more than 40% of its questions. Each run fixes the lessons that `npx tsx scripts/answer-length.ts 10` lists under `next`.

For those lessons, go over every question (both `qs` and `keys`):
- Shorten the right answer to its core, or lengthen the wrong ones with plausible detail, so that all options are about the same length. Mix both, so the right answer is the longest in no more than about a third of the questions, and sometimes the shortest or in the middle. For one-word answers, choose wrong options of similar or greater length.
- Wrong answers stay clearly wrong for someone who read the text, and stay fit for a child. Do not change the question, its meaning or the `why` field, and keep the right answer true to the text.
- Do not touch anything else in the file.

Check each fixed lesson with `npx tsx scripts/answer-length.ts 1000`: it must no longer be listed. Run `npx tsc --noEmit` and `npx vitest run src/knowledge`. Stop when the script prints `lessonsLeft: 0`.
