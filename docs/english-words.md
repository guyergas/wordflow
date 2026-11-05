# Adding English words

The word bank in `src/words.ts` has fewer words than the Ministry of Education's lists. Each run adds 20 words, half for each:

- **Band I level (entering grade 5):** common A1 words not yet in the bank, such as everyday nouns, verbs and adjectives. The official Band I list could not be retrieved, so choose from your knowledge of common beginner words. Append to level block 0 or 1 of `RAW`, by difficulty.
- **Band II level (grades 7 to 9):** the next single words, in order, from the Ministry's list that are not in the bank: https://hertzog-hs.mashov.info/wp-content/uploads/sites/86/2024/06/LexicalBand2.pdf. Skip phrases. If it cannot be fetched, choose common A2 words. Append to level block 1, 2 or 3 of `RAW`, by difficulty.

Line format: `word|Hebrew translation|pos|example sentence`, where pos is n, v, a, d or o, and the sentence contains the exact word and is fit for a child. Always append at the end of a block, since the order of existing words must not change. Check first that the word is not already in the file. Stop when the bank has 3,400 words.
