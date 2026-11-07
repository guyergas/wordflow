# Answer length in knowledge questions

In most knowledge questions the right answer was the longest option, so a child could pick it without reading. Each run fixes the lessons that `npx tsx scripts/answer-length.ts 8` lists under `next`.

For every question in those lessons (both `qs` and `keys`) where the right answer is clearly the longest:
- Shorten the right answer to its core, or lengthen the wrong ones with plausible detail, so that all options are about the same length. Mix both, so the right answer is sometimes the shortest and sometimes in the middle.
- Wrong answers stay clearly wrong for someone who read the text, and stay fit for a child. Do not change the question, its meaning or the `why` field, and keep the right answer true to the text.
- Do not touch anything else in the file.

Run `npx tsc --noEmit` and `npx vitest run src/knowledge`. Stop when the script prints `lessonsLeft: 0`.
