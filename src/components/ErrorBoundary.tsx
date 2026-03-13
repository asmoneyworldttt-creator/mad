import { Component, type ReactNode } from 'react';

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

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: any) {
        console.error('[Dentora Error Boundary]', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
                    <div className="max-w-md w-full text-center space-y-6 p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Something went wrong</h2>
                            <p className="text-slate-500 text-sm font-medium">
                                An unexpected error occurred. Please refresh the page to continue.
                            </p>
                            {this.state.error && (
                                <p className="mt-3 text-xs text-rose-400 font-mono bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
                                    {this.state.error.message}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                            Refresh Application
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
