"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  price_override: number | null;
  color_image_url?: string | null;
  in_stock?: boolean;
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
  const [added,setAdded] = useState(false);
  const sizes = useMemo(
    () => [...new Set(variants.map((variant)=>variant.size).filter((value): value is string => Boolean(value)))],
    [variants]
  );
  const colors = useMemo(
    () => [...new Set(variants.map((variant)=>variant.color).filter((value): value is string => Boolean(value)))],
    [variants]
  );

  const [selectedSize,setSelectedSize] = useState(sizes[0] ?? "");
  const [selectedColor,setSelectedColor] = useState(colors[0] ?? "");
  const [quantity,setQuantity] = useState(1);

  const selectedVariant = useMemo(() => {
    return variants.find((variant) =>
      (sizes.length ? variant.size === selectedSize : true) &&
      (colors.length ? variant.color === selectedColor : true)
    ) ?? null;
  },[variants,sizes.length,colors.length,selectedSize,selectedColor]);

  const effectivePrice = selectedVariant?.price_override ?? unitPrice;
  const variantLabel = selectedVariant
    ? [selectedVariant.size,selectedVariant.color].filter(Boolean).join(" · ") || "Variant"
    : undefined;
  const productInStock = variants.length === 0 ? true : variants.some((variant)=>variant.in_stock !== false);
  const canAdd = productInStock && (variants.length === 0 || Boolean(selectedVariant));

  const colorImage = selectedColor
    ? variants.find((variant)=>variant.color===selectedColor && variant.color_image_url)?.color_image_url
    : null;

  return (
    <div className="mt-8 grid gap-5">
      {sizes.length ? (
        <div className="grid gap-2">
          <span className="text-sm font-semibold">Size</span>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size)=>(
              <button
                key={size}
                type="button"
                onClick={()=>setSelectedSize(size)}
                className={`rounded-xl border px-4 py-2 text-sm font-bold ${selectedSize===size ? "border-black bg-black text-white" : "border-black/15 bg-white"}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {colors.length ? (
        <div className="grid gap-2">
          <span className="text-sm font-semibold">Color</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {colors.map((color)=>{
              const imageUrl=variants.find((variant)=>variant.color===color && variant.color_image_url)?.color_image_url;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={()=>setSelectedColor(color)}
                  className={`flex items-center gap-3 rounded-xl border p-2 text-left ${selectedColor===color ? "border-black ring-1 ring-black" : "border-black/15"}`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                    {imageUrl ? <img src={imageUrl} alt={color} className="h-full w-full object-cover" /> : <span className="text-[10px] text-black/35">Color</span>}
                  </span>
                  <span className="text-sm font-bold">{color}</span>
                </button>
              );
            })}
          </div>
          {colorImage ? <p className="text-xs text-black/45">Photo shown for selected color: {selectedColor}</p> : null}
        </div>
      ) : null}

      <div className="grid gap-2">
        <span className="text-sm font-semibold">Quantity</span>
        <div className="flex w-fit items-center overflow-hidden rounded-xl border border-black/15 bg-white">
          <button type="button" onClick={()=>setQuantity((value)=>Math.max(1,value-1))} className="px-4 py-3 text-lg font-black" aria-label="Decrease quantity">−</button>
          <input
            aria-label="Quantity"
            type="number"
            min={1}
            max={25}
            value={quantity}
            onChange={(event)=>{
              const next=Number(event.target.value);
              setQuantity(Number.isFinite(next) ? Math.max(1,Math.min(25,Math.floor(next))) : 1);
            }}
            className="w-16 border-x border-black/10 px-2 py-3 text-center font-bold outline-none"
          />
          <button type="button" onClick={()=>setQuantity((value)=>Math.min(25,value+1))} className="px-4 py-3 text-lg font-black" aria-label="Increase quantity">+</button>
        </div>
      </div>

      {!productInStock ? (
        <div className="rounded-xl bg-neutral-100 px-4 py-3 text-sm font-bold text-black/55">
          Currently unavailable
        </div>
      ) : null}

      <button
        type="button"
        disabled={!canAdd}
        className="w-full rounded-xl bg-black px-5 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        onClick={()=>{
          if(!canAdd) return;
          addItem({
            productId,
            variantId:selectedVariant?.id ?? null,
            variantLabel,
            storeSlug,
            name,
            unitPrice:effectivePrice,
            quantity,
          });
          setAdded(true);
          window.setTimeout(()=>setAdded(false),1200);
        }}
      >
        {added ? `Added ${quantity} to cart` : `Add ${quantity} to cart`}
      </button>
    </div>
  );
}
