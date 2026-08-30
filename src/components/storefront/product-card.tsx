import Link from "next/link";

export type StorefrontProductCardData = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  primaryImageUrl?: string | null;
  secondaryImageUrl?: string | null;
  badge?: string | null;
  colors?: { name: string; imageUrl?: string | null }[];
};

export function ProductCard({
  storeSlug,
  product,
}: {
  storeSlug: string;
  product: StorefrontProductCardData;
}) {
  const colorCount = product.colors?.length ?? 0;

  return (
    <article className="product-card">
      <Link href={`/shop/${storeSlug}/products/${product.slug}`} className="product-card__link">
        <div className="product-card__media">
          {product.primaryImageUrl ? (
            <img
              src={product.primaryImageUrl}
              alt={product.name}
              className="product-card__image product-card__image--primary"
            />
          ) : (
            <div className="product-card__placeholder" aria-hidden="true">
              <span>Creative Ape</span>
            </div>
          )}

          {product.secondaryImageUrl ? (
            <img
              src={product.secondaryImageUrl}
              alt=""
              className="product-card__image product-card__image--secondary"
            />
          ) : null}

          {product.badge ? <span className="product-card__badge">{product.badge}</span> : null}
        </div>

        <div className="product-card__details">
          <div>
            <h3 className="product-card__title">{product.name}</h3>
            {colorCount ? (
              <p className="product-card__meta">{colorCount} {colorCount === 1 ? "color" : "colors"}</p>
            ) : null}
          </div>
          <p className="product-card__price">${(product.priceCents / 100).toFixed(2)}</p>
        </div>
      </Link>
    </article>
  );
}
