import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    componentDidMount() {
        // Clear the chunk reload flag on successful mount
        sessionStorage.removeItem('soma_chunk_reload');
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
        
        // Auto-reload on chunk load errors (e.g., after a new deployment)
        const isChunkLoadError = error.name === 'ChunkLoadError' || 
            (error.message && error.message.toLowerCase().includes('failed to fetch dynamically imported module'));
            
        if (isChunkLoadError) {
            const hasReloaded = sessionStorage.getItem('soma_chunk_reload');
            if (!hasReloaded) {
                sessionStorage.setItem('soma_chunk_reload', 'true');
                window.location.reload();
                return;
            }
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                    <div className="max-w-md text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
                        <p className="text-slate-500 mb-6 text-sm">
                            Somo Smart encountered an unexpected error. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-indigo-200"
                        >
                            Refresh Page
                        </button>
                        {this.state.error && (
                            <details className="mt-6 text-left bg-slate-100 rounded-xl p-4">
                                <summary className="text-xs font-bold text-slate-500 cursor-pointer">Technical Details</summary>
                                <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40">{this.state.error.message}</pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
