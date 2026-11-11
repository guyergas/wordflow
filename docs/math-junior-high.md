# Math for grades 7-9

The math course runs to the end of ninth grade. Stations 11-21 in `src/math/skills.ts` hold the junior-high material, and each run adds the next 2 skills from the list below, in order, to the end of the `SKILLS` array (station order does not depend on array position). Delete a line from this list once its skill is in, in the same commit. Stop when the list is empty. An id must not already exist in `SKILLS`; if it does, pick a new one.

Follow the existing skills exactly: look at stations 9 and 10 (`subst`, `like`, `eq1`, `eq2`, `eqword`) for the format. Each skill has a unique `id`, its `station`, a Hebrew `title`, `needs` (ids of skills it builds on, which must exist), and `e` (a computed answer, built with `calc`) and/or `u` (a concept question, built with `conceptQ`). Use the seeded `r` for all randomness, keep numbers small enough for pencil and paper, wrap math in `[[...]]`, give two or three likely wrong answers with their trap, and two or three short Hebrew solution `steps`. Hebrew is addressed in feminine plural or neutral, like the existing skills. Answers must be exact; prefer integer results by choosing values backwards from the answer.

Run `npx tsc --noEmit` and `npx vitest run src/math`, and fix what fails. The tests generate many questions per skill and check that answers parse and wrong answers differ from the right one.

## List

Elementary gaps first (grades 4 to 6, found against the Ministry's program in Nov 2026):

Junior high:
