// Offering a generated file: through the claude.ai viewer's download capability when the app runs there,
// otherwise as a normal browser download.

type Host = { use: (n: string) => Promise<{ save: (r: { filename: string; data: string | Blob }) => Promise<unknown> } | null> };

export const inHostFrame = () => window.self !== window.top;

export type SaveOutcome = 'saved' | 'declined' | 'unavailable';

export async function saveFile(filename: string, data: string | Blob, mime = 'application/octet-stream'): Promise<SaveOutcome> {
  const host = (window as unknown as { claude?: Host }).claude;
  if (host?.use) {
    const dl = await host.use('downloads');
    if (dl) {
      try {
        await dl.save({ filename, data });
        return 'saved';
      } catch (e) {
        return (e as { code?: string })?.code === 'declined' ? 'declined' : 'unavailable';
      }
    }
    if (inHostFrame()) return 'unavailable';
  }
  const blob = typeof data === 'string' ? new Blob([data], { type: mime }) : data;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'saved';
}
