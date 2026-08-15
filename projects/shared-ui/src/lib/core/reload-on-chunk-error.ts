/**
 * After a GitHub Pages deploy, open tabs may still request deleted hashed chunks.
 * Pages answers those with HTML 404 (or a transient 503), which breaks dynamic import.
 * One guarded reload usually picks up the new index.html + chunk set.
 */
export function reloadOnChunkLoadError(): void {
  const storageKey = 'rb:chunk-reload-at';

  const maybeReload = (reason: unknown): void => {
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : String(reason ?? '');

    if (
      !/Failed to fetch dynamically imported module|error loading dynamically imported module|Loading chunk [\w-]+ failed/i.test(
        message,
      )
    ) {
      return;
    }

    const last = Number(sessionStorage.getItem(storageKey) ?? 0);
    if (Date.now() - last < 15_000) {
      return;
    }
    sessionStorage.setItem(storageKey, String(Date.now()));
    location.reload();
  };

  window.addEventListener('unhandledrejection', (event) => {
    maybeReload(event.reason);
  });

  window.addEventListener('error', (event) => {
    maybeReload(event.error ?? event.message);
  });
}
