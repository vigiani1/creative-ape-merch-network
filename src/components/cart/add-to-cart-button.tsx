"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

export function AddToCartButton({ productId, storeSlug, name, unitPrice }: { productId: string; storeSlug: string; name: string; unitPrice: number }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      className="mt-8 w-full rounded-xl bg-black px-5 py-4 font-bold text-white"
      onClick={() => {
        addItem({ productId, storeSlug, name, unitPrice });
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1200);
      }}
    >
      {added ? "Added to cart" : "Add to cart"}
    </button>
  );
}
