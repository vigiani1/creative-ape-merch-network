"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [testOrder, setTestOrder] = useState<{ orderNumber: string; grandTotal: number } | null>(null);
  const storeSlug = items[0]?.storeSlug;

  async function createTestOrder() {
    if (!storeSlug || items.length === 0) return;

    setLoading(true);
    setError(null);
    setTestOrder(null);

    try {
      const response = await fetch("/api/test-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          customerName,
          customerEmail,
          items: items.map(({ productId, quantity }) => ({ productId, quantity })),
        }),
      });

      const payload = await response.json() as {
        orderNumber?: string;
        grandTotal?: number;
        error?: string;
      };

      if (!response.ok || !payload.orderNumber) {
        throw new Error(payload.error || "Unable to create test order.");
      }

      setTestOrder({
        orderNumber: payload.orderNumber,
        grandTotal: Number(payload.grandTotal ?? 0),
      });
      clear();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to create test order.");
    } finally {
      setLoading(false);
    }
  }

  if (testOrder) {
    return (
      <main className="mx-auto max-w-3xl p-6 py-14">
        <div className="rounded-3xl border border-black/10 bg-white p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-black/45">Test checkout complete</p>
          <h1 className="mt-3 text-4xl font-black">Order created</h1>
          <p className="mt-4 text-black/60">
            No card was charged and no real payment was processed. This order exists only so the app workflow can be tested.
          </p>
          <div className="mt-6 rounded-2xl bg-neutral-950 p-5 text-white">
            <p className="text-sm text-white/55">Test order</p>
            <p className="mt-1 text-2xl font-black">{testOrder.orderNumber}</p>
            <p className="mt-3 text-lg font-bold">${(testOrder.grandTotal / 100).toFixed(2)}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin/orders" className="rounded-xl bg-black px-4 py-3 text-sm font-bold text-white">View admin orders</Link>
            {storeSlug ? <Link href={`/shop/${storeSlug}`} className="rounded-xl border border-black/15 px-4 py-3 text-sm font-bold">Back to store</Link> : null}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black">Cart</h1>
        {storeSlug ? <Link className="text-sm font-semibold underline" href={`/shop/${storeSlug}`}>Continue shopping</Link> : null}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-black/10 bg-white p-8">
          <p className="font-bold">Your cart is empty.</p>
          <Link href="/" className="mt-3 inline-block text-sm underline">Back to Creative Ape Merch Network</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {items.map((item) => (
            <div key={item.productId} className="flex flex-wrap items-center gap-4 rounded-2xl border border-black/10 bg-white p-5">
              <div className="min-w-0 flex-1">
                <p className="font-bold">{item.name}</p>
                <p className="text-sm text-black/55">${(item.unitPrice / 100).toFixed(2)} each</p>
              </div>
              <input
                aria-label={`Quantity for ${item.name}`}
                className="w-20 rounded-lg border border-black/15 px-3 py-2"
                type="number"
                min={1}
                max={25}
                value={item.quantity}
                onChange={(event) => setQuantity(item.productId, Number(event.target.value))}
              />
              <button className="text-sm font-semibold underline" onClick={() => removeItem(item.productId)}>Remove</button>
            </div>
          ))}

          <div className="mt-4 rounded-2xl bg-neutral-950 p-6 text-white">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <strong className="text-2xl">${(subtotal / 100).toFixed(2)}</strong>
            </div>

            <div className="mt-6 rounded-2xl bg-white/5 p-5">
              <p className="font-bold">Test checkout</p>
              <p className="mt-2 text-sm text-white/60">Creates a real test order in the app database. No Stripe account, card, or money is involved.</p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Customer name
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="rounded-xl border border-white/15 bg-white px-4 py-3 font-normal text-black"
                    placeholder="Test Customer"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Customer email
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    className="rounded-xl border border-white/15 bg-white px-4 py-3 font-normal text-black"
                    placeholder="test@example.com"
                  />
                </label>
              </div>

              {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

              <button
                type="button"
                onClick={createTestOrder}
                disabled={loading || customerName.trim().length < 2 || !customerEmail.includes("@")}
                className="mt-5 w-full rounded-xl bg-white px-5 py-4 font-bold text-black disabled:opacity-50"
              >
                {loading ? "Creating test order..." : "Create test order · No payment"}
              </button>
            </div>

            <p className="mt-4 text-xs text-white/45">Real payment checkout stays disabled until Stripe is deliberately connected later.</p>
          </div>
        </div>
      )}
    </main>
  );
}
