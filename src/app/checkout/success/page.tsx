"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

export default function CheckoutSuccessPage() {
  const { clear } = useCart();
  const cleared = useRef(false);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setStoreSlug(params.get("store"));

    if (!cleared.current) {
      cleared.current = true;
      clear();
    }
  }, [clear]);

  return (
    <main className="checkout-success">
      <div className="checkout-success__mark">✓</div>
      <p className="store-eyebrow">Order received</p>
      <h1>Thank you.</h1>
      <p>
        Your payment was submitted successfully. We’re confirming the order details now and your receipt will be sent by email.
      </p>
      <div className="checkout-success__actions">
        {storeSlug ? <Link href={`/shop/${storeSlug}`} className="store-button">Back to store</Link> : null}
        <Link href="/" className="store-text-link">Creative Ape Merch Network</Link>
      </div>
    </main>
  );
}
