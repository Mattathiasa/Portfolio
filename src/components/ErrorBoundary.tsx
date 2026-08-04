import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback. When omitted, a branded full-screen card is shown. */
  fallback?: ReactNode;
  /** Label used in the console group so we know which boundary tripped. */
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render/runtime errors in its subtree so a single crash (e.g. a WebGL
 * failure in the Three.js scene) degrades gracefully instead of white-screening
 * the whole page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.name ? `: ${this.props.name}` : ''}]`, error, info);
  }

  private reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;

    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] via-[hsl(var(--hero-gradient-via))] to-[hsl(var(--hero-gradient-to))]"
      >
        <div className="glass-card border border-accent/20 rounded-2xl max-w-md w-full p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold gradient-text">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error interrupted the page. Reloading usually fixes it.
          </p>
          {this.state.error?.message && (
            <p className="text-xs text-muted-foreground/70 font-mono break-words">
              {this.state.error.message}
            </p>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={this.reset}
              className="px-4 py-2 rounded-lg border border-accent/30 text-accent text-sm font-medium hover:bg-accent/10 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
