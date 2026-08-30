"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="app-state" role="alert">
      <p className="store-eyebrow">Something went wrong</p>
      <h1>That page hit a snag.</h1>
      <p>Nothing was changed. You can try the request again or return to the previous page.</p>
      <div className="app-state__actions">
        <button type="button" className="store-button" onClick={reset}>Try again</button>
        <button type="button" className="store-text-link app-state__link-button" onClick={() => window.history.back()}>Go back</button>
      </div>
    </main>
  );
}
