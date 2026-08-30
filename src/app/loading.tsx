export default function Loading() {
  return (
    <main className="app-state app-state--loading" aria-live="polite" aria-busy="true">
      <div className="app-state__mark" />
      <p className="store-eyebrow">Loading</p>
      <h1>Getting things ready.</h1>
      <div className="app-loading-bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
