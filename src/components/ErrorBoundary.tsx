import { Component, type ReactNode } from "react";

interface Props {
  fallback?: ReactNode;
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="p-6 text-center">
        <p className="text-down font-medium">Something went wrong.</p>
        <p className="text-muted text-sm mt-1">{this.state.error.message}</p>
        <button
          onClick={this.reset}
          className="mt-3 px-3 py-1 rounded bg-surface-2 border border-border hover:bg-surface"
        >
          Retry
        </button>
      </div>
    );
  }
}
