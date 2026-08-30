"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storeSlug = items[0]?.storeSlug;

  async function checkout() {
    if (!storeSlug || items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ storeSlug, items: items.map(({ productId, quantity }) => ({ productId, quantity })) }),
      });
      const payload = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || "Unable to start checkout");
      window.location.href = payload.checkoutUrl;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-6 py-12">
      <div className="flex items-center justify-between"><h1 className="text-4xl font-black">Cart</h1>{storeSlug ? <Link className="text-sm font-semibold underline" href={`/shop/${storeSlug}`}>Continue shopping</Link> : null}</div>
      {items.length === 0 ? <div className="mt-10 rounded-2xl border border-black/10 bg-white p-8"><p className="font-bold">Your cart is empty.</p><Link href="/" className="mt-3 inline-block text-sm underline">Back to Creative Ape Merch Network</Link></div> : (
        <div className="mt-8 grid gap-4">
          {items.map((item) => <div key={item.productId} className="flex flex-wrap items-center gap-4 rounded-2xl border border-black/10 bg-white p-5"><div className="min-w-0 flex-1"><p className="font-bold">{item.name}</p><p className="text-sm text-black/55">${(item.unitPrice / 100).toFixed(2)} each</p></div><input aria-label={`Quantity for ${item.name}`} className="w-20 rounded-lg border border-black/15 px-3 py-2" type="number" min={1} max={25} value={item.quantity} onChange={(event) => setQuantity(item.productId, Number(event.target.value))} /><button className="text-sm font-semibold underline" onClick={() => removeItem(item.productId)}>Remove</button></div>)}
          <div className="mt-4 rounded-2xl bg-neutral-950 p-6 text-white"><div className="flex items-center justify-between"><span>Subtotal</span><strong className="text-2xl">${(subtotal / 100).toFixed(2)}</strong></div><p className="mt-2 text-xs text-white/55">Shipping, taxes and eligible adjustments are calculated during checkout.</p>{error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}<button type="button" onClick={checkout} disabled={loading} className="mt-5 w-full rounded-xl bg-white px-5 py-4 font-bold text-black disabled:opacity-50">{loading ? "Opening secure checkout..." : "Checkout with Stripe"}</button></div>
        </div>
      )}
    </main>
  );
}
