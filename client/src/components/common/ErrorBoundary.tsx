import { Component, ErrorInfo, ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled render error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px]">warning</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {this.props.fallbackTitle || 'Rendering Error Occurred'}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            {this.state.error?.message ||
              this.props.fallbackMessage ||
              'A component failed to render properly. You can reload or return to the main portal.'}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm transition-all"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-sm transition-all"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
