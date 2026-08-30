"use client";

import { useMemo, useState } from "react";
import { ProductPurchasePanel } from "@/components/storefront/product-purchase-panel";

type MediaItem = {
  id: string;
  url?: string | null;
  altText?: string | null;
  isPrimary?: boolean;
};

type ColorItem = {
  name: string;
  imageUrl?: string | null;
};

type Availability = {
  id: string;
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  quantity?: number | null;
  status?: string | null;
  priceCents: number;
};

export function ProductDetailExperience({
  productId,
  storeSlug,
  name,
  description,
  categoryLabel,
  basePriceCents,
  media,
  sizes,
  colors,
  availability,
}: {
  productId: string;
  storeSlug: string;
  name: string;
  description?: string | null;
  categoryLabel: string;
  basePriceCents: number;
  media: MediaItem[];
  sizes: string[];
  colors: ColorItem[];
  availability: Availability[];
}) {
  const [selectedColor, setSelectedColor] = useState("");

  const primaryMedia = media.find((item) => item.isPrimary) ?? media[0] ?? null;
  const selectedColorImage = colors.find((item) => item.name === selectedColor)?.imageUrl || null;

  const displayMedia = useMemo(() => {
    if (!selectedColorImage) return media;

    const synthetic: MediaItem = {
      id: `color:${selectedColor}`,
      url: selectedColorImage,
      altText: `${name} in ${selectedColor}`,
      isPrimary: true,
    };

    return [synthetic, ...media.filter((item) => item.url !== selectedColorImage)];
  }, [media, name, selectedColor, selectedColorImage]);

  const leadImage = displayMedia[0]?.url || primaryMedia?.url || null;

  return (
    <section className="pdp-layout">
      <div className="pdp-gallery">
        {displayMedia.length ? (
          displayMedia.map((item, index) => (
            <figure
              key={item.id}
              className={index === 0 ? "pdp-gallery__item pdp-gallery__item--primary" : "pdp-gallery__item"}
            >
              {item.url ? (
                <img src={item.url} alt={item.altText || name} />
              ) : (
                <div className="pdp-gallery__placeholder" />
              )}
            </figure>
          ))
        ) : (
          <figure className="pdp-gallery__item pdp-gallery__item--primary">
            <div className="pdp-gallery__placeholder">
              <span>Creative Ape</span>
            </div>
          </figure>
        )}
      </div>

      <aside className="pdp-panel">
        <div className="pdp-panel__sticky">
          <p className="store-eyebrow">{categoryLabel}</p>
          <h1>{name}</h1>
          {description ? <p className="pdp-description">{description}</p> : null}

          <ProductPurchasePanel
            productId={productId}
            storeSlug={storeSlug}
            name={name}
            basePriceCents={basePriceCents}
            imageUrl={leadImage}
            sizes={sizes}
            colors={colors}
            availability={availability}
            selectedColorExternal={selectedColor}
            onColorChange={setSelectedColor}
          />

          <div className="pdp-accordions">
            <details open>
              <summary>Details</summary>
              <div><p>{description || "Official merchandise produced by Creative Ape Branding."}</p></div>
            </details>
            <details>
              <summary>Shipping</summary>
              <div><p>Shipping options and delivery estimates are shown at checkout.</p></div>
            </details>
            <details>
              <summary>Returns</summary>
              <div><p>Return eligibility depends on the product and customization. Review store policies before ordering.</p></div>
            </details>
            {sizes.length ? (
              <details id="size-guide">
                <summary>Size guide</summary>
                <div><p>Choose your usual apparel size unless the product description notes a special fit.</p></div>
              </details>
            ) : null}
          </div>
        </div>
      </aside>
    </section>
  );
}
