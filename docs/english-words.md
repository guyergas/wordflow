# Adding English words

The word bank in `src/words.ts` lacks words from the Ministry of Education's official lists (Lexical Bands, 2020). `docs/english-words-missing.txt` lists the missing single words, in the Ministry's order, under four headings. Each run adds 20 words, half for each:

- **10 from Pre-Band I, then Band I (elementary school):** the first words remaining under those headings. Append to level block 0 or 1 of `RAW`, by difficulty.
- **10 from Band II Core I, then Band II Core II (junior high):** the first words remaining under those headings. Append to level block 1, 2 or 3 of `RAW`, by difficulty.

Delete each word from the list file once it is handled, in the same commit. A word with no sensible Hebrew translation or example sentence for a child, such as a function word like "the", is deleted without being added. Phrases are out of scope.

Line format: `word|Hebrew translation|pos|example sentence`, where pos is n, v, a, d or o, and the sentence contains the exact word and is fit for a child. Always append at the end of a block, since the order of existing words must not change. Check first that the word is not already in the file. Stop when the list file has no words left.
