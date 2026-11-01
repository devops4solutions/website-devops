// Sends a custom event to whichever privacy-friendly analytics provider is loaded (Plausible or Umami).
// Safe to call anywhere: it does nothing in development or when no provider is configured.

type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: ((event: string, options?: { props?: Props }) => void) & { q?: unknown[] };
    umami?: { track: (event: string, data?: Props) => void };
  }
}

export function track(event: string, props: Props = {}): void {
  try {
    if (typeof window.plausible === "function") window.plausible(event, { props });
    else if (window.umami?.track) window.umami.track(event, props);
  } catch {
    // Analytics must never break the page.
  }
}
