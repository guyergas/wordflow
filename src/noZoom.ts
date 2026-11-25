// No zooming anywhere in the app. Little ones pinch or double-tap by chance and get stuck seeing part of the
// screen. The viewport tag says so (index.html), but iPhone ignores it, so pinch gestures are also stopped here,
// CSS stops double-tap zoom (styles.css), and a screen that is zoomed anyway snaps back to normal size.
const VIEWPORT = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';

export function blockZoom() {
  const stop = (e: Event) => e.preventDefault();
  // iPhone's own pinch events.
  document.addEventListener('gesturestart', stop, { passive: false });
  document.addEventListener('gesturechange', stop, { passive: false });
  // Two fingers moving = a pinch everywhere else.
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  // Ctrl + wheel / trackpad pinch on a computer.
  document.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });

  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', () => {
      if (vv.scale > 1.01) {
        const tag = document.querySelector('meta[name="viewport"]');
        // Writing the tag again makes the browser apply it, which brings the scale back to 1.
        tag?.setAttribute('content', `${VIEWPORT},initial-scale=1`);
        setTimeout(() => tag?.setAttribute('content', VIEWPORT), 50);
      }
    });
  }
}
