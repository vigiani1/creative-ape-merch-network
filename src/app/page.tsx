import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-16 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-sm font-medium">Creative Ape Branding</div>
        <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight md:text-7xl">Merch stores for teams, schools, businesses, clubs and communities.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-black/65">One network for branded storefronts, products, fulfillment, reporting and revenue sharing.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link className="rounded-xl bg-black px-5 py-3 font-semibold text-white" href="/admin">Open admin</Link>
          <Link className="rounded-xl border border-black/15 bg-white px-5 py-3 font-semibold" href="/portal">Organization portal</Link>
          <Link className="rounded-xl border border-black/15 bg-white px-5 py-3 font-semibold" href="/shop/demo">Preview storefront route</Link>
        </div>
      </div>
    </main>
  );
}
