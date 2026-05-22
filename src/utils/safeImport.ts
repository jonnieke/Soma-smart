/**
 * Wraps dynamic imports to handle loading chunk failures gracefully.
 * If a chunk fails to load (e.g. due to a new build deployment and service worker cache mismatches),
 * it triggers a reload of the page to fetch the latest assets.
 */

const CHUNK_RELOAD_KEY = 'soma_chunk_reload_count';
const CHUNK_RELOAD_MAX = 2; // maximum auto-reloads before giving up
const CHUNK_RELOAD_WINDOW_MS = 60_000; // reset counter after 60 s of clean runtime

/** Emit a transient toast notification shown at top of viewport. */
const showChunkToast = (msg: string, type: 'info' | 'warn' | 'error' = 'info') => {
  const existing = document.getElementById('soma-chunk-toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'soma-chunk-toast';
  const colours = {
    info:  'background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;',
    warn:  'background:linear-gradient(135deg,#d97706,#b45309);color:#fff;',
    error: 'background:linear-gradient(135deg,#dc2626,#9f1239);color:#fff;',
  };
  el.setAttribute('style', [
    'position:fixed;top:16px;left:50%;transform:translateX(-50%) translateY(-120%);',
    'z-index:99999;padding:10px 20px;border-radius:999px;font:700 13px/1.4 system-ui,sans-serif;',
    'box-shadow:0 8px 32px rgba(0,0,0,.25);transition:transform .35s cubic-bezier(.34,1.56,.64,1);',
    'white-space:nowrap;pointer-events:none;',
    colours[type],
  ].join(''));
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    el.style.transform = 'translateX(-50%) translateY(-120%)';
    setTimeout(() => el.remove(), 400);
  }, 4000);
};

/** Returns true when the error looks like a failed dynamic-import / chunk error. */
const isChunkError = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /failed to fetch/i.test(msg) ||
    /dynamically imported module/i.test(msg) ||
    /loading chunk/i.test(msg) ||
    /loading css chunk/i.test(msg) ||
    (err instanceof TypeError)
  );
};

/** Retry importFn up to `retries` times with exponential back-off delay. */
const retryImport = <T,>(
  importFn: () => Promise<T>,
  retries = 3,
  delayMs = 800
): Promise<T> =>
  importFn().catch((err) => {
    if (retries <= 0 || !isChunkError(err)) throw err;
    return new Promise<T>((resolve, reject) =>
      setTimeout(() =>
        retryImport(importFn, retries - 1, delayMs * 2).then(resolve, reject),
        delayMs
      )
    );
  });

/**
 * safeImport — wraps a dynamic import with:
 *   1. Up to 3 exponential back-off retries.
 *   2. Offline guard: if the user is offline, show a friendly toast instead of reloading.
 *   3. Bounded page-reload recovery: localStorage counter caps reloads at CHUNK_RELOAD_MAX
 *      within a 60 s window, preventing infinite reload loops.
 *   4. User-visible slide-in toast for every recovery action.
 */
export const safeImport = <T,>(importFn: () => Promise<T>): Promise<T> => {
  return retryImport(importFn, 3, 800).catch((err) => {
    if (!isChunkError(err)) throw err;

    if (!navigator.onLine) {
      showChunkToast("⚡ You're offline — reconnect to continue loading.", 'warn');
      throw err;
    }

    // Read bounded reload counter from localStorage
    let reloadCount = 0;
    let windowStart = 0;
    try {
      const raw = localStorage.getItem(CHUNK_RELOAD_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        reloadCount = parsed.count ?? 0;
        windowStart = parsed.ts ?? 0;
      }
    } catch { /* ignore parse errors */ }

    const now = Date.now();
    if (now - windowStart > CHUNK_RELOAD_WINDOW_MS) {
      // Reset the counter — new time window
      reloadCount = 0;
      windowStart = now;
    }

    if (reloadCount < CHUNK_RELOAD_MAX) {
      try {
        localStorage.setItem(CHUNK_RELOAD_KEY, JSON.stringify({ count: reloadCount + 1, ts: windowStart }));
      } catch { /* storage quota or private mode */ }
      showChunkToast('🔄 Refreshing for the latest Somo version...', 'info');
      console.warn('[safeImport] Chunk load failed — auto-reloading.', err);
      setTimeout(() => window.location.reload(), 600);
    } else {
      showChunkToast('⚠️ Could not load a module. Try refreshing manually.', 'error');
      console.error('[safeImport] Chunk load failed too many times — giving up.', err);
    }

    throw err;
  });
};
