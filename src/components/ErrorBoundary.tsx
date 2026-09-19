import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.hash = '#/info365';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf8f5] dark:bg-[#070b12] text-[#2c2621] dark:text-[#e6edf3] flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-lg w-full bg-white dark:bg-[#111722] rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold font-heading-cinzel text-[#2a2016] dark:text-[#f3e8d2]">
                Przepraszamy, wystąpił błąd
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif-book leading-relaxed">
                Wystąpił nieoczekiwany problem podczas wyświetlania wybranej sekcji. Możesz spróbować odświeżyć stronę lub powrócić do przewodnika Droga365.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-stone-100 dark:bg-[#18202d] text-left border border-stone-200 dark:border-stone-800 text-xs font-mono text-rose-700 dark:text-rose-300 overflow-x-auto max-h-36">
                <strong>Błąd:</strong> {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Odśwież stronę</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-[#1e2738] hover:bg-stone-300 dark:hover:bg-[#28354c] text-stone-800 dark:text-stone-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Wróć do info365</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
