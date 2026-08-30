"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

const SUPABASE_FUNCTIONS_URL = "https://nqlwauyerrxcddjmdpcx.supabase.co/functions/v1";

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const storeSlug = items[0]?.storeSlug;

  const canCheckout = useMemo(() => {
    return Boolean(
      storeSlug &&
      items.length > 0 &&
      customerName.trim().length >= 2 &&
      customerEmail.includes("@") &&
      line1.trim().length >= 2 &&
      city.trim().length >= 2 &&
      state.trim().length >= 2 &&
      postalCode.trim().length >= 3
    );
  }, [storeSlug, items.length, customerName, customerEmail, line1, city, state, postalCode]);

  async function checkout() {
    if (!storeSlug || !canCheckout) return;

    setLoading(true);
    setError(null);

    try {
      const origin = window.location.origin;
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout-session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          idempotencyKey: crypto.randomUUID(),
          customerName,
          customerEmail,
          shippingAddress: {
            line1,
            line2: line2 || undefined,
            city,
            state,
            postal_code: postalCode,
            country: "US",
          },
          cartItems: items.map(({ productId, variantId, size, color, quantity }) => ({
            productId,
            variantId: variantId ?? null,
            size: size ?? null,
            color: color ?? null,
            quantity,
          })),
          successUrl: `${origin}/checkout/success?store=${encodeURIComponent(storeSlug)}`,
          cancelUrl: `${origin}/cart?checkout=cancelled`,
        }),
      });

      const payload = await response.json() as {
        checkoutUrl?: string;
        error?: string;
        errors?: { message?: string }[];
      };

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(
          payload.error ||
          payload.errors?.[0]?.message ||
          "Checkout is temporarily unavailable."
        );
      }

      window.location.assign(payload.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  if (!items.length) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <p className="store-eyebrow">Cart</p>
          <h1>Your cart is empty.</h1>
          <p>Head back to the store and find something worth printing.</p>
          <Link href="/" className="store-button">Browse stores</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <div>
          <p className="store-eyebrow">Checkout</p>
          <h1>Almost yours.</h1>
        </div>
        {storeSlug ? <Link href={`/shop/${storeSlug}`}>Continue shopping</Link> : null}
      </header>

      <div className="checkout-layout">
        <section className="checkout-form">
          <div className="checkout-section">
            <div className="checkout-section__heading">
              <span>01</span>
              <div>
                <h2>Contact</h2>
                <p>We’ll send your order confirmation here.</p>
              </div>
            </div>

            <div className="checkout-fields checkout-fields--two">
              <label>
                <span>Name</span>
                <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} autoComplete="email" />
              </label>
            </div>
          </div>

          <div className="checkout-section">
            <div className="checkout-section__heading">
              <span>02</span>
              <div>
                <h2>Shipping</h2>
                <p>Where should we send the order?</p>
              </div>
            </div>

            <div className="checkout-fields">
              <label>
                <span>Address</span>
                <input value={line1} onChange={(event) => setLine1(event.target.value)} autoComplete="address-line1" />
              </label>
              <label>
                <span>Apartment, suite, etc. <em>Optional</em></span>
                <input value={line2} onChange={(event) => setLine2(event.target.value)} autoComplete="address-line2" />
              </label>
            </div>

            <div className="checkout-fields checkout-fields--three">
              <label>
                <span>City</span>
                <input value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" />
              </label>
              <label>
                <span>State</span>
                <input value={state} onChange={(event) => setState(event.target.value)} autoComplete="address-level1" placeholder="CA" />
              </label>
              <label>
                <span>ZIP code</span>
                <input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} autoComplete="postal-code" />
              </label>
            </div>
          </div>

          <div className="checkout-section checkout-section--payment">
            <div className="checkout-section__heading">
              <span>03</span>
              <div>
                <h2>Payment</h2>
                <p>You’ll finish payment securely with Stripe.</p>
              </div>
            </div>

            {error ? <div className="checkout-error">{error}</div> : null}

            <button
              type="button"
              className="checkout-pay"
              disabled={!canCheckout || loading}
              onClick={checkout}
            >
              {loading ? "Preparing secure checkout…" : `Continue to payment · $${(subtotal / 100).toFixed(2)}`}
            </button>

            <p className="checkout-secure-note">Your cart is revalidated before payment. Prices and inventory are confirmed server-side.</p>
          </div>
        </section>

        <aside className="checkout-summary">
          <div className="checkout-summary__sticky">
            <div className="checkout-summary__heading">
              <h2>Order summary</h2>
              <span>{items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
            </div>

            <div className="checkout-summary__items">
              {items.map((item) => (
                <article key={`${item.productId}:${item.variantId ?? "base"}`} className="checkout-line">
                  <div className="checkout-line__media">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <div />}
                    <span>{item.quantity}</span>
                  </div>
                  <div className="checkout-line__copy">
                    <h3>{item.name}</h3>
                    {item.color ? <p>Color: {item.color}</p> : null}
                    {item.size ? <p>Size: {item.size}</p> : null}
                    <div className="checkout-line__actions">
                      <div className="checkout-line__qty">
                        <button type="button" onClick={() => setQuantity(item.productId, item.variantId, item.quantity - 1)}>−</button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => setQuantity(item.productId, item.variantId, item.quantity + 1)}>+</button>
                      </div>
                      <button type="button" onClick={() => removeItem(item.productId, item.variantId)}>Remove</button>
                    </div>
                  </div>
                  <strong>${((item.unitPrice * item.quantity) / 100).toFixed(2)}</strong>
                </article>
              ))}
            </div>

            <div className="checkout-summary__totals">
              <div><span>Subtotal</span><strong>${(subtotal / 100).toFixed(2)}</strong></div>
              <div><span>Shipping</span><span>Calculated next</span></div>
              <div className="checkout-summary__total"><span>Total</span><strong>${(subtotal / 100).toFixed(2)} USD</strong></div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
