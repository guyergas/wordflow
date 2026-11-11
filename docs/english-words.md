# Adding English words

**Paused (the parent's choice, Nov 2026):** add no new words, sentence translations or phrases until every existing knowledge lesson is lengthened and no lesson is listed by `npx tsx scripts/answer-length.ts`. Existing lessons come first.

The word bank in `src/words.ts` lacks words from the Ministry of Education's official lists (Lexical Bands, 2020). `docs/english-words-missing.txt` lists the missing single words, in the Ministry's order, under four headings. Each run adds 20 words, half for each:

- **10 from Pre-Band I, then Band I (elementary school):** the first words remaining under those headings. Append to level block 0 or 1 of `RAW`, by difficulty.
- **10 from Band II Core I, then Band II Core II (junior high):** the first words remaining under those headings. Append to level block 1, 2 or 3 of `RAW`, by difficulty.

Delete each word from the list file once it is handled, in the same commit. A word with no sensible Hebrew translation or example sentence for a child, such as a function word like "the", is deleted without being added. Phrases are out of scope.

Line format: `word|Hebrew translation|pos|example sentence|Hebrew translation of the sentence`, where pos is n, v, a, d or o, and the sentence contains the exact word and is fit for a child. The last field puts the word into sentence practice, and every word must have it. Always append at the end of a block, since the order of existing words must not change. Check first that the word is not already in the file. Stop when the list file has no words left.

## Older words without a sentence translation

Each run also adds the last field to the first 20 lines of `src/words.ts` that lack it, in natural Hebrew, without changing anything else on the line.

## Phrases

`docs/english-phrases-missing.txt` lists the Ministry's phrases not yet practiced, in order. Each run takes the first 10 and appends them to the end of the `phrases` block in `src/sentences.ts`, as `English|Hebrew`. Use the phrase alone when it stands by itself ("Good luck!") and in a short sentence fit for a child otherwise. Some entries were cut off in the PDF or use `sth`, `sb`, `etc` and slashes: write the real phrase, and pick one form. Delete each one from the list once handled, in the same commit. Never insert a line above existing ones, because sentence ids follow the order.
