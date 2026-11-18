import { Component } from 'react';

/**
 * Catches render errors in a page so one broken component shows a
 * recoverable message instead of blanking the whole app.
 * Pass `resetKey` (e.g. the current path) to clear the error on navigation.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  // Clear a caught error when the reset key (current route) changes.
  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error, info) {
    console.error('UI error caught by ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="page-content" role="alert">
        <div style={{ maxWidth: 520, margin: '15vh auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 500, color: 'var(--md-on-surface)', marginBottom: 'var(--space-2)' }}>
            Something went wrong on this page
          </h1>
          <p style={{ color: 'var(--md-on-surface-variant)', marginBottom: 'var(--space-6)' }}>
            The rest of the app still works. Try again, or go back to the dashboard.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => this.setState({ error: null })}>Try again</button>
            <a className="btn btn-secondary" href="/dashboard">Dashboard</a>
          </div>
        </div>
      </div>
    );
  }
}
