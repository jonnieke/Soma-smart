import React, { Component, ErrorInfo, ReactNode } from 'react';

// Matches the key defined in Learner.tsx safeImport
const CHUNK_RELOAD_KEY = 'soma_chunk_reload_count';
const CHUNK_RELOAD_MAX = 2; // maximum auto-reloads before giving up
const CHUNK_RELOAD_WINDOW_MS = 60_000; // reset counter after 60 s of clean runtime

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    isOffline: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, isOffline: false };
    }

    componentDidMount() {
        // On a successful mount the app is healthy — reset the chunk reload counter
        // so future navigation resets the back-off budget after a clean session.
        try { localStorage.removeItem(CHUNK_RELOAD_KEY); } catch { /* ignore */ }
        // Legacy session key clean-up
        sessionStorage.removeItem('soma_chunk_reload');
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error, isOffline: !navigator.onLine };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught:', error, errorInfo);

        const msg = error ? error.message || '' : '';
        const name = error ? error.name || '' : '';
        const isTdzOrChunkError =
            name === 'ReferenceError' ||
            /before initialization/i.test(msg) ||
            /failed to fetch/i.test(msg) ||
            /dynamically imported module/i.test(msg) ||
            /loading chunk/i.test(msg) ||
            /loading css chunk/i.test(msg);

        if (isTdzOrChunkError) {
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

                console.warn('[ErrorBoundary] TDZ/ReferenceError/Chunk load failed — auto-reloading to bust cache.', error);

                // Bust cache by unregistering service workers & deleting caches, then reload.
                const performBustAndReload = async () => {
                    try {
                        if ('serviceWorker' in navigator) {
                            const registrations = await navigator.serviceWorker.getRegistrations();
                            for (const reg of registrations) {
                                await reg.unregister();
                            }
                        }
                        if ('caches' in window) {
                            const keys = await caches.keys();
                            for (const key of keys) {
                                await caches.delete(key);
                            }
                        }
                    } catch (e) {
                        console.error('[ErrorBoundary] SW/Cache cleanup failed:', e);
                    } finally {
                        window.location.reload();
                    }
                };

                // Wait 600ms to allow logs or any notifications to show, then reload.
                setTimeout(() => {
                    performBustAndReload();
                }, 600);
            } else {
                console.error('[ErrorBoundary] TDZ/ReferenceError/Chunk load failed too many times — giving up.', error);
            }
        }
    }

    render() {
        if (this.state.hasError) {
            const { isOffline, error } = this.state;

            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
                    <div className="max-w-md text-center">
                        {/* Icon */}
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isOffline ? 'bg-amber-100' : 'bg-red-100'}`}>
                            {isOffline ? (
                                <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                                </svg>
                            ) : (
                                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            )}
                        </div>

                        {/* Heading */}
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            {isOffline ? 'You\'re Offline' : 'Something went wrong'}
                        </h1>

                        {/* Message */}
                        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed">
                            {isOffline
                                ? 'Somo Smart needs an internet connection to load this section. Please check your network and try again.'
                                : 'Somo Smart encountered an unexpected error. This is usually caused by a stale cached version. Refreshing typically fixes it.'}
                        </p>

                        {/* CTA */}
                        <button
                            onClick={() => window.location.reload()}
                            className={`font-bold py-3 px-8 rounded-xl transition-colors shadow-lg text-white ${
                                isOffline
                                    ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-200'
                                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-200'
                            }`}
                        >
                            {isOffline ? 'Retry Connection' : 'Refresh Page'}
                        </button>

                        {/* Technical details (collapsed) */}
                        {error && !isOffline && (
                            <details className="mt-6 text-left bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
                                <summary className="text-xs font-bold text-slate-500 cursor-pointer">Technical Details</summary>
                                <pre className="text-xs text-red-600 dark:text-red-400 mt-2 overflow-auto max-h-40">{error.message}</pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

