// Daily practice reminder as a calendar event (iCalendar), and a Google Calendar link.

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Local floating time "YYYYMMDDTHHMMSS" (no timezone: the calendar keeps the wall-clock time). */
function stamp(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function utcStamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** The next occurrence (today or later) of hh:mm on one of `days` (0 = Sunday). */
export function firstOccurrence(time: string, days: number[], now = new Date()): Date {
  const [h, m] = time.split(':').map(Number);
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, m, 0, 0);
    if (days.includes(d.getDay()) && d.getTime() > now.getTime()) return d;
  }
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, h, m);
}

export function rrule(days: number[]): string {
  const sorted = [...new Set(days)].sort();
  return sorted.length === 7 || !sorted.length ? 'FREQ=DAILY' : `FREQ=WEEKLY;BYDAY=${sorted.map((d) => DAY_CODES[d]).join(',')}`;
}

const TITLE = 'NoteFlow · עשר דקות של תווים';
const DESC = 'האימון היומי מחכה: פותחים את NoteFlow ומתחילים מהכפתור במסך הבית.';

/** A repeating 10-minute event with an alert at its start. */
export function reminderIcs(time: string, days: number[], now = new Date()): string {
  const start = firstOccurrence(time, days, now);
  const end = new Date(start.getTime() + 10 * 60_000);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NoteFlow//Reminder//HE', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:noteflow-daily-${utcStamp(now)}@noteflow`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `RRULE:${rrule(days)}`,
    `SUMMARY:${TITLE}`,
    `DESCRIPTION:${DESC}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${TITLE}`, 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}

/** Google Calendar "add event" link with the same repeating event. */
export function googleCalendarUrl(time: string, days: number[], now = new Date()): string {
  const start = firstOccurrence(time, days, now);
  const end = new Date(start.getTime() + 10 * 60_000);
  const p = new URLSearchParams({
    action: 'TEMPLATE', text: TITLE, details: DESC, dates: `${stamp(start)}/${stamp(end)}`, recur: `RRULE:${rrule(days)}`,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
