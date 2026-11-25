// The little ones learn capital I with a line on top and at the bottom, as it is drawn in tracing (letters.ts).
// Fonts print it as one plain line, so wherever the courses print English text, a capital I is drawn instead,
// at the size and color of the text around it.
import { Fragment } from 'react';

export const SerifI = () => (
  <svg className="serif-i" viewBox="0 0 64 100" role="img" aria-label="I">
    <path d="M14 9H50M32 9V91M14 91H50" fill="none" stroke="currentColor" strokeWidth="15" strokeLinecap="round" />
  </svg>
);

/** English text with every capital I drawn as the course teaches it. */
export function EnText({ text }: { text: string }) {
  if (!text.includes('I')) return <>{text}</>;
  return <>{text.split('I').map((part, i) => <Fragment key={i}>{i > 0 && <SerifI />}{part}</Fragment>)}</>;
}
