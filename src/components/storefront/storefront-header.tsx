"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

type NavItem = {
  id?: string;
  label: string;
  target: string;
};

export function StorefrontHeader({
  storeSlug,
  storeName,
  logoUrl,
  navigation,
}: {
  storeSlug: string;
  storeName: string;
  logoUrl?: string | null;
  navigation: NavItem[];
}) {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="store-header">
        <div className="store-header__inner">
          <button
            type="button"
            className="store-header__menu"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <span />
            <span />
          </button>

          <Link href={`/shop/${storeSlug}`} className="store-header__brand" aria-label={storeName}>
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="store-header__logo" />
            ) : (
              <span className="store-header__wordmark">{storeName}</span>
            )}
          </Link>

          <nav className="store-header__nav" aria-label="Primary">
            {navigation.map((item) => (
              <Link key={item.id ?? item.target} href={item.target.startsWith("/") ? `/shop/${storeSlug}${item.target === "/" ? "" : item.target}` : item.target}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="store-header__actions">
            <Link href={`/shop/${storeSlug}/search`} aria-label="Search" className="store-header__action">
              Search
            </Link>
            <Link href="/cart" aria-label={`Cart with ${itemCount} items`} className="store-header__action">
              Cart{itemCount ? ` (${itemCount})` : ""}
            </Link>
          </div>
        </div>
      </header>

      {open ? (
        <div className="store-mobile-nav" role="dialog" aria-modal="true" aria-label="Store menu">
          <div className="store-mobile-nav__top">
            <span className="store-header__wordmark">{storeName}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
              Close
            </button>
          </div>
          <nav>
            {navigation.map((item) => (
              <Link
                key={item.id ?? item.target}
                href={item.target.startsWith("/") ? `/shop/${storeSlug}${item.target === "/" ? "" : item.target}` : item.target}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="store-mobile-nav__footer">
            <Link href={`/shop/${storeSlug}/search`} onClick={() => setOpen(false)}>Search</Link>
            <Link href="/cart" onClick={() => setOpen(false)}>Cart{itemCount ? ` (${itemCount})` : ""}</Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
