# Adding English grammar topics

Topics are in `src/grammar/topics.ts`. Each run adds one: the first topic in the list below that is not there yet. The order follows the Ministry of Education's English curriculum (Curriculum 2020, elementary Table 6 and the junior-high grammar table for grades 7-9).

`words` is how many known words the topic waits for. It must not go down along the array, so insert each new topic at its place by `words`, not at the end. The learner gets the first topic in the array not yet seen. A topic's part on the grammar page comes from `GRAMMAR_PARTS` in the same file: it belongs to the last part whose `from` is at most its `words`.

Each topic needs `rule` (one or two short Hebrew sentences), `example` (in English) and at least 25 questions in the form `[sentence with ___, right, [wrong, ...], why]`. Why is one short Hebrew sentence. Sentences are fit for a child and use common words. Only one answer may fit: if a wrong answer would also be correct English, add a word like "yesterday" or "now" that rules it out. Run `npx vitest run src/grammar`.

## Already in

- יסודות: a/an, רבים, am/is/are, have/has, this/that, כינויי גוף, possessive 's, שם תואר לפני שם עצם, and/but/or/because (words 40 to 155)
- Present Simple: הפועל ו־s, s/es/ies (160 to 170)
- שלילה: isn't/aren't, don't/doesn't, isn't או doesn't (200 to 220)
- שאלות: Is/Are, Do/Does, מילות שאלה, מילת שאלה ופועל (240 to 270)
- עוד מבנים בסיסיים: מילות יחס של מקום ושל זמן, there is/are, ציווי ו־Let's, can/can't (280 to 296)
- Present Progressive: 4 topics (300 to 340)
- Past Simple: 6 topics (450 to 590)
- כמויות והשוואה: some/any, much/many, bigger/more, the biggest/the most, good/better/best (600 to 640)
- עתיד: will, won't, going to, will מול going to (650 to 700)
- מתקדמים: quick/quickly, must/have to/could, should, can/may/mustn't, said/told, before/after/when/first/then, who/which (720 to 770); Past Progressive, while/when, Present Progressive לתוכניות, ing כשם, used to, could בעבר, סביל, if ו־when, If I had, I would, a school bus (800 to 910)

## List

The list is finished: every topic in the Ministry's plan is in, except Present Perfect. A run with nothing to add skips this step.

Present Perfect (experiences with ever and never, since and for, just and yet, and the passive in Present Perfect) is in the Ministry's plan for grades 8 and 9, but leave it out until Guy asks for it.
