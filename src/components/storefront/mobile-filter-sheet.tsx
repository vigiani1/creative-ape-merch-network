"use client";

import { useState } from "react";

type Category = { name: string; slug: string; count: number };

function buildUrl(
  storeSlug: string,
  current: { category?: string | null; q?: string; sort?: string; stock?: boolean },
  changes: Partial<{ category: string | null; stock: boolean }>,
) {
  const params = new URLSearchParams();
  const category = changes.category !== undefined ? changes.category : current.category;
  const stock = changes.stock !== undefined ? changes.stock : current.stock;

  if (category) params.set("category", category);
  if (current.q) params.set("q", current.q);
  if (current.sort && current.sort !== "featured") params.set("sort", current.sort);
  if (stock) params.set("stock", "1");

  const query = params.toString();
  return `/shop/${storeSlug}/catalog${query ? `?${query}` : ""}`;
}

export function MobileFilterSheet({
  storeSlug,
  categories,
  category,
  search,
  sort,
  inStock,
}: {
  storeSlug: string;
  categories: Category[];
  category?: string | null;
  search?: string;
  sort?: string;
  inStock?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="mobile-filter-trigger"
        onClick={() => setOpen(true)}
      >
        Filters
      </button>

      {open ? (
        <div className="mobile-filter-sheet" role="dialog" aria-modal="true" aria-label="Product filters">
          <button
            type="button"
            className="mobile-filter-sheet__overlay"
            onClick={() => setOpen(false)}
            aria-label="Close filters"
          />
          <div className="mobile-filter-sheet__panel">
            <div className="mobile-filter-sheet__header">
              <div>
                <p className="store-eyebrow">Shop</p>
                <h2>Filters</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)}>Close</button>
            </div>

            <section className="mobile-filter-sheet__section">
              <h3>Category</h3>
              <div className="mobile-filter-sheet__options">
                <a
                  href={buildUrl(storeSlug, { category, q: search, sort, stock: inStock }, { category: null })}
                  className={!category ? "is-active" : ""}
                >
                  <span>All products</span>
                </a>
                {categories.map((item) => (
                  <a
                    key={item.slug}
                    href={buildUrl(storeSlug, { category, q: search, sort, stock: inStock }, { category: item.slug })}
                    className={category === item.slug ? "is-active" : ""}
                  >
                    <span>{item.name}</span>
                    <span>{item.count}</span>
                  </a>
                ))}
              </div>
            </section>

            <section className="mobile-filter-sheet__section">
              <h3>Availability</h3>
              <div className="mobile-filter-sheet__options">
                <a
                  href={buildUrl(storeSlug, { category, q: search, sort, stock: inStock }, { stock: !inStock })}
                  className={inStock ? "is-active" : ""}
                >
                  <span>In stock only</span>
                  <span>{inStock ? "On" : "Off"}</span>
                </a>
              </div>
            </section>

            <div className="mobile-filter-sheet__footer">
              <a href={`/shop/${storeSlug}/catalog`} className="mobile-filter-clear">Clear all</a>
              <button type="button" className="mobile-filter-done" onClick={() => setOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
