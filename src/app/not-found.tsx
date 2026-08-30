import Link from "next/link";

export default function NotFound() {
  return (
    <main className="app-state">
      <p className="store-eyebrow">404</p>
      <h1>We couldn’t find that page.</h1>
      <p>The link may be outdated, or the page may have moved.</p>
      <div className="app-state__actions">
        <Link href="/" className="store-button">Go home</Link>
        <Link href="/shop/demo" className="store-text-link">Open demo store</Link>
      </div>
    </main>
  );
}
