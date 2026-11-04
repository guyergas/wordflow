# Writing full-length lessons

For Hebrew-speaking girls aged 10–12. Read `geo.continents` in `src/knowledge/deep/geo.ts` first, and match its length, voice and depth.

Next lesson: `npx esbuild scripts/next-lesson.ts --bundle --platform=node --outfile=/tmp/next.cjs --log-level=error && node /tmp/next.cjs`

- `kind: expand`: add `'id': { text: `...`, qs: [...] },` before the closing `};` in the given file. Everything in `idea` and `keys` must be stated clearly in the text, since those stay as they are.
- `kind: new`: add a complete lesson to `NEW_LESSONS`: `L('course', 'short-id', level, 'title', 'Hebrew Wikipedia page name', `text`, 'idea in one sentence', qs, keys),` on a topic not in `existingTitles`, one a curious child would enjoy and that closes a gap in general knowledge. `keys` holds 1–2 review questions. Level: 0 basic, 1 middle, 2 above age level.

## Every lesson
- Text: 700–900 words of natural Hebrew in backticks (no backticks or ${ inside), feminine address when addressing the reader, paragraphs separated by a blank line. Stories, examples, causes, surprising facts, a link to Israel or daily life where natural. Clear, short sentences; explain every hard word. No clichés or translationese. Reread for grammar.
- Marks: wrap 7–10 whole important sentences in [[...]], the yellow marker. A mark holds whole sentences, ends after the final punctuation, and never contains a blank line. Mark main ideas, not trivia. About half of the questions are answered by marked sentences, half by unmarked text.
- Questions: 10–12 multiple-choice, in the order of the text, `[question, right, [wrong, wrong], why]`. At least 2 plausible wrong options, all unique; mostly why/how and the general idea; `why` is one short sentence. Inside single-quoted strings use Hebrew ׳ and ״.
- Accuracy matters most. Only well-established facts, numbers rounded. If unsure of a name, date or figure, check with WebSearch or WebFetch, or leave it out. Never invent quotes, studies or anecdotes; label legends as legends. Records and medal counts change: check them and state the year.
- Contested politics, religion or history: present the sides fairly and take none; on the Israeli–Arab conflict give both narratives in their own words. Nothing graphic. No detailed Holocaust content; a separate unit awaits parent approval.

## By course
- `art`: describe poems, songs and books in your own words; no lines of in-copyright work. Leave out suicide or self-harm in artists' lives.
- `sport`: no weight or body-shape targets and no diet advice.
- `heb`: the writing must be exemplary, with many worked examples; questions apply the rule to new examples. State only well-established etymologies; the Academy of the Hebrew Language is a good source.
- `jud`: written for secular and religious families alike. Use phrases like ״לפי המסורת״, say what scholars say where relevant, and how streams and communities practise, without preaching or mocking. Quotes from sources must be exact, or paraphrase.
- `food`: no diets, calorie numbers, intake or portion numbers, weight or body-shape talk, ״good״ or ״bad״ foods, guilt, or anything that could encourage restricting food. Emphasize food groups, vitamins and minerals, and which foods contain what, including Israeli foods. Supplements only with a doctor. Emergencies: call an adult and מד״א 101.
