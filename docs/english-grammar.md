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

## List

- מתקדמים · תואר הפועל: quick, quickly · words 720
- מתקדמים · בקשה וחובה: can, could, must, have to · words 730
- מתקדמים · should לעצה, כולל שלילה ושאלה · words 740
- מתקדמים · רשות ואיסור: can, may I, mustn't · words 745
- מתקדמים · דיבור עקיף: He said that, She told me that · words 750
- מתקדמים · זמן ורצף: before, after, when, first, then · words 760
- מתקדמים · משפט זיקה: who ו־that · words 770
- מתקדמים · Past Progressive: was playing, were playing · words 800
- מתקדמים · Past Progressive מול Past Simple: while ו־when · words 810
- מתקדמים · Present Progressive לתוכניות: I'm meeting her tomorrow · words 820
- מתקדמים · ing כשם: Swimming is fun, I like reading · words 830
- מתקדמים · used to ו־didn't use to · words 840
- מתקדמים · could ליכולת בעבר · words 845
- מתקדמים · סביל בהווה ובעבר: is made, was built · words 880
- מתקדמים · תנאי אמיתי: if ו־when · words 890
- מתקדמים · תנאי שני: If I had, I would · words 900
- מתקדמים · שם עצם כתואר: a school bus, an English teacher · words 910

Present Perfect (experiences with ever and never, since and for, just and yet, and the passive in Present Perfect) is in the Ministry's plan for grades 8 and 9, but leave it out until Guy asks for it.
