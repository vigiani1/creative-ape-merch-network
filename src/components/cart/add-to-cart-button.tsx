"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  price_override: number | null;
};

export function AddToCartButton({
  productId,
  storeSlug,
  name,
  unitPrice,
  variants = [],
}: {
  productId: string;
  storeSlug: string;
  name: string;
  unitPrice: number;
  variants?: Variant[];
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [variants, selectedVariantId]
  );

  const effectivePrice = selectedVariant?.price_override ?? unitPrice;
  const variantLabel = selectedVariant
    ? [selectedVariant.size, selectedVariant.color].filter(Boolean).join(" · ") || "Variant"
    : undefined;

  return (
    <div className="mt-8 grid gap-3">
      {variants.length ? (
        <label className="grid gap-2 text-sm font-semibold">
          Choose option
          <select
            value={selectedVariantId}
            onChange={(event) => setSelectedVariantId(event.target.value)}
            className="rounded-xl border border-black/15 bg-white px-4 py-3"
          >
            {variants.map((variant) => {
              const label = [variant.size, variant.color].filter(Boolean).join(" · ") || "Variant";
              const price = variant.price_override ?? unitPrice;
              return (
                <option key={variant.id} value={variant.id}>
                  {label} · ${(price / 100).toFixed(2)}
                </option>
              );
            })}
          </select>
        </label>
      ) : null}

      <div className="grid gap-2">
        <span className="text-sm font-semibold">Quantity</span>
        <div className="flex w-fit items-center overflow-hidden rounded-xl border border-black/15 bg-white">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="px-4 py-3 text-lg font-black" aria-label="Decrease quantity">−</button>
          <input
            aria-label="Quantity"
            type="number"
            min={1}
            max={25}
            value={quantity}
            onChange={(event) => {
              const next = Number(event.target.value);
              setQuantity(Number.isFinite(next) ? Math.max(1, Math.min(25, Math.floor(next))) : 1);
            }}
            className="w-16 border-x border-black/10 px-2 py-3 text-center font-bold outline-none"
          />
          <button type="button" onClick={() => setQuantity((value) => Math.min(25, value + 1))} className="px-4 py-3 text-lg font-black" aria-label="Increase quantity">+</button>
        </div>
        <p className="text-xs text-black/45">Up to 25 units of this option per cart line.</p>
      </div>

      <button
        type="button"
        disabled={variants.length > 0 && !selectedVariant}
        className="w-full rounded-xl bg-black px-5 py-4 font-bold text-white disabled:opacity-50"
        onClick={() => {
          addItem({
            productId,
            variantId: selectedVariant?.id ?? null,
            variantLabel,
            storeSlug,
            name,
            unitPrice: effectivePrice,
            quantity,
          });
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1200);
        }}
      >
        {added ? `Added ${quantity} to cart` : variants.length ? `Add ${quantity} selected to cart` : `Add ${quantity} to cart`}
      </button>
    </div>
  );
}
