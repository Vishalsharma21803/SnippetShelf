import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center bg-ink p-8 text-slate-100">
        <section
          role="alert"
          className="max-w-md rounded-xl border border-line bg-panel p-8"
        >
          <h1 className="text-2xl font-semibold">
            Your workspace hit a problem
          </h1>
          <p className="my-4 text-muted">
            Reload to restore your last saved library.
          </p>
          <button
            className="primary-button"
            onClick={() => window.location.reload()}
          >
            Reload workspace
          </button>
        </section>
      </main>
    );
  }
}
