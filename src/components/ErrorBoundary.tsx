import React, { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error Info:', errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-950">
          <div className="max-w-md w-full mx-auto px-4 py-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <div className="h-6 w-6 text-red-400">⚠</div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-gray-400 text-sm mb-6">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-3 bg-gray-900 rounded-lg border border-gray-800 text-left">
                <p className="text-xs font-mono text-gray-300 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
