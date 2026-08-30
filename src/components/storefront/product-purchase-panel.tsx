"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

type Availability = {
  id: string;
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  quantity?: number | null;
  status?: string | null;
  priceCents: number;
};

export function ProductPurchasePanel({
  productId,
  storeSlug,
  name,
  basePriceCents,
  imageUrl,
  sizes,
  colors,
  availability,
  selectedColorExternal,
  onColorChange,
}: {
  productId: string;
  storeSlug: string;
  name: string;
  basePriceCents: number;
  imageUrl?: string | null;
  sizes: string[];
  colors: { name: string; imageUrl?: string | null }[];
  availability: Availability[];
  selectedColorExternal?: string;
  onColorChange?: (color: string) => void;
}) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColorInternal, setSelectedColorInternal] = useState("");
  const selectedColor = selectedColorExternal ?? selectedColorInternal;
  const setSelectedColor = (color: string) => {
    if (onColorChange) onColorChange(color);
    else setSelectedColorInternal(color);
  };
  const [quantity, setQuantity] = useState(1);

  const requiresSize = sizes.length > 0;
  const requiresColor = colors.length > 0;

  const sizeAvailable = (size: string) =>
    availability.some((item) =>
      item.size === size &&
      (!selectedColor || item.color === selectedColor) &&
      item.status !== "discontinued" &&
      item.status !== "unavailable" &&
      (item.quantity == null || item.quantity > 0)
    );

  const colorAvailable = (color: string) =>
    availability.some((item) =>
      item.color === color &&
      (!selectedSize || item.size === selectedSize) &&
      item.status !== "discontinued" &&
      item.status !== "unavailable" &&
      (item.quantity == null || item.quantity > 0)
    );

  const selectedVariant = useMemo(() => {
    return availability.find((item) =>
      (!requiresSize || item.size === selectedSize) &&
      (!requiresColor || item.color === selectedColor) &&
      item.status !== "discontinued"
    ) ?? null;
  }, [availability, requiresSize, requiresColor, selectedSize, selectedColor]);

  const effectivePrice = selectedVariant?.priceCents ?? basePriceCents;
  const fullySelected = (!requiresSize || Boolean(selectedSize)) && (!requiresColor || Boolean(selectedColor));
  const available = Boolean(
    fullySelected &&
    (!selectedVariant || (
      selectedVariant.status !== "unavailable" &&
      selectedVariant.status !== "discontinued" &&
      (selectedVariant.quantity == null || selectedVariant.quantity >= quantity)
    ))
  );

  const selectedColorImage = colors.find((item) => item.name === selectedColor)?.imageUrl;
  const message = !fullySelected
    ? requiresColor && !selectedColor
      ? "Select a Color"
      : requiresSize && !selectedSize
        ? "Select a Size"
        : ""
    : !available
      ? "This combination is unavailable"
      : "";

  return (
    <div className="pdp-purchase">
      <p className="pdp-price">${(effectivePrice / 100).toFixed(2)}</p>

      {requiresColor ? (
        <section className="pdp-option">
          <div className="pdp-option__label">
            <span>Color</span>
            <strong>{selectedColor || "Choose a color"}</strong>
          </div>
          <div className="pdp-colors">
            {colors.map((color) => {
              const canUse = colorAvailable(color.name);
              const selected = selectedColor === color.name;
              return (
                <button
                  key={color.name}
                  type="button"
                  disabled={!canUse}
                  className={`pdp-color ${selected ? "is-selected" : ""}`}
                  onClick={() => setSelectedColor(color.name)}
                  aria-pressed={selected}
                >
                  <span className="pdp-color__swatch">
                    {color.imageUrl ? <img src={color.imageUrl} alt="" /> : color.name.slice(0, 1)}
                  </span>
                  <span>{color.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {requiresSize ? (
        <section className="pdp-option">
          <div className="pdp-option__label">
            <span>Size</span>
            <a href="#size-guide">Size guide</a>
          </div>
          <div className="pdp-sizes">
            {sizes.map((size) => {
              const canUse = sizeAvailable(size);
              const selected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={!canUse}
                  className={selected ? "is-selected" : ""}
                  onClick={() => setSelectedSize(size)}
                  aria-pressed={selected}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="pdp-option">
        <div className="pdp-option__label"><span>Quantity</span></div>
        <div className="pdp-quantity">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">−</button>
          <span>{quantity}</span>
          <button type="button" onClick={() => setQuantity((value) => Math.min(25, value + 1))} aria-label="Increase quantity">+</button>
        </div>
      </section>

      {message ? <p className="pdp-selection-message">{message}</p> : null}

      <button
        type="button"
        className="pdp-add"
        disabled={!available}
        onClick={() => {
          if (!available) return;
          addItem({
            productId,
            variantId: selectedVariant?.id ?? null,
            variantLabel: [selectedColor, selectedSize].filter(Boolean).join(" · "),
            storeSlug,
            name,
            unitPrice: effectivePrice,
            quantity,
            size: selectedSize || null,
            color: selectedColor || null,
            imageUrl: selectedColorImage || imageUrl || null,
          });
        }}
      >
        Add to Cart
      </button>

      <div className="pdp-trust">
        <p>Secure checkout</p>
        <p>Made and fulfilled by Creative Ape Branding</p>
      </div>
    </div>
  );
}
