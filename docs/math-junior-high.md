# Math for grades 7-9

The math course runs to the end of ninth grade. Stations 11-21 in `src/math/skills.ts` hold the junior-high material, and each run adds the next 2 skills from the list below, in order, to the end of the `SKILLS` array (station order does not depend on array position). Delete a line from this list once its skill is in, in the same commit. Stop when the list is empty. An id must not already exist in `SKILLS`; if it does, pick a new one.

Follow the existing skills exactly: look at stations 9 and 10 (`subst`, `like`, `eq1`, `eq2`, `eqword`) for the format. Each skill has a unique `id`, its `station`, a Hebrew `title`, `needs` (ids of skills it builds on, which must exist), and `e` (a computed answer, built with `calc`) and/or `u` (a concept question, built with `conceptQ`). Use the seeded `r` for all randomness, keep numbers small enough for pencil and paper, wrap math in `[[...]]`, give two or three likely wrong answers with their trap, and two or three short Hebrew solution `steps`. Hebrew is addressed in feminine plural or neutral, like the existing skills. Answers must be exact; prefer integer results by choosing values backwards from the answer.

Run `npx tsc --noEmit` and `npx vitest run src/math`, and fix what fails. The tests generate many questions per skill and check that answers parse and wrong answers differ from the right one.

## List

Elementary gaps first (grades 4 to 6, found against the Ministry's program in Nov 2026):

Junior high:
- station 15 · sci · כתיב מדעי · needs powneg
- station 15 · rootsimp · שורשים: הערכה ופישוט · needs root
- station 16 · sqsum · נוסחאות כפל מקוצר: (a+b)², (a−b)², (a+b)(a−b) · needs simplify
- station 16 · trinom · פירוק טרינום x²+bx+c · needs sqsum, factor1
- station 16 · quadeq · משוואה ריבועית בפירוק · needs trinom
- station 16 · quadform · נוסחת השורשים · needs quadeq, rootsimp
- station 16 · parab · פרבולה: קודקוד ונקודות חיתוך · needs quadeq, linefn
- station 17 · prop · פרופורציה ומכפלה בהצלבה · needs ratio
- station 17 · pctchg · שינוי באחוזים (עלייה וירידה) · needs pctof
- station 17 · pctrev · מציאת המחיר המקורי אחרי שינוי · needs pctchg
- station 17 · interest · ריבית פשוטה וריבית דריבית בשנתיים · needs pctchg
- station 17 · directinv · יחס ישר ויחס הפוך · needs prop
- station 18 · extang · זווית חיצונית במשולש · needs trisum
- station 18 · isos · משולש שווה שוקיים · needs trisum
- station 18 · polyang · סכום זוויות במצולע · needs trisum
- station 18 · congr · משפטי חפיפה (איזה משפט מתאים) · needs isos
- station 19 · pyth · משפט פיתגורס: מציאת היתר · needs rootimp, trisum
- station 19 · pyth2 · משפט פיתגורס: מציאת ניצב ובעיות · needs pyth
- station 19 · circle · היקף מעגל ושטח עיגול · needs area
- station 19 · sector · קשת וגזרה · needs circle
- station 20 · prismvol · נפח ושטח פנים של מנסרה וגליל · needs circle
- station 20 · similar · משולשים דומים ויחס דמיון · needs prop
- station 20 · scalearea · יחס שטחים ויחס נפחים · needs similar
- station 21 · median · חציון ושכיח · needs mean
- station 21 · probnot · מאורע משלים והסתברות באחוזים · needs prob
- station 21 · prob2 · הסתברות של שני מאורעות (טבלה או עץ) · needs probnot
