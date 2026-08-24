import React, { Component, ErrorInfo } from 'react';

/**
 * A simple error boundary that logs errors and displays a fallback UI.
 */
type Props = {
  /** Optional fallback node to render when an error occurs */
  fallback?: React.ReactNode;
};

export default class ErrorBoundary extends Component<Props> {
  // Explicitly type the state to satisfy TypeScript and esbuild
  state = { hasError: false, error: undefined as Error | undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}
