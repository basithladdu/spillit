/** Full-page loading spinner used across data-fetching routes. */
export function PageSpinner({ label = 'Loading' }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
      aria-busy="true"
      aria-atomic="true"
      aria-label={label}
    >
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"
        aria-hidden
      />
    </div>
  );
}

/** Retry panel when Supabase or network fetch fails. */
export function FetchErrorPanel({
  eyebrow = 'Connection paused',
  title = 'That spill hit a snag.',
  message = 'We couldn’t load this page right now. Try again when your connection is ready.',
  retryLabel = 'Try again',
  onRetry,
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section
        role="alert"
        aria-live="assertive"
        className="w-full max-w-md rounded-2xl border-2 border-foreground bg-card p-8 text-center shadow-pop"
      >
        <p className="heading-font mb-3 text-xs font-black uppercase tracking-[0.2em] text-accent">
          {eyebrow}
        </p>
        <h1 className="heading-font mb-3 text-3xl font-black">{title}</h1>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border-2 border-foreground bg-accent px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-pop transition-transform hover:-translate-y-0.5"
        >
          {retryLabel}
        </button>
      </section>
    </main>
  );
}
