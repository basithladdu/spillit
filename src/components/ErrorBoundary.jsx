import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Spill It render error', error, info);
  }

  handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <section className="w-full max-w-md rounded-2xl border-2 border-foreground bg-card p-8 text-center shadow-pop" role="alert" aria-live="assertive">
          <p className="heading-font text-xs font-black uppercase tracking-[0.2em] text-accent mb-3">
            A small detour
          </p>
          <h1 className="heading-font text-3xl font-black mb-3">That spill hit a snag.</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            The page could not finish rendering. Reload once and we’ll try again.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-full border-2 border-foreground bg-accent px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-pop hover:-translate-y-0.5 transition-transform"
          >
            Reload Spill It
          </button>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
