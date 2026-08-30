"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";

export function CartDrawer() {
  const { items, subtotal, isOpen, closeCart, setQuantity, removeItem } = useCart();

  if (!isOpen) return null;

  return (
    <div className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button className="cart-drawer__overlay" type="button" onClick={closeCart} aria-label="Close cart" />
      <aside className="cart-drawer__panel">
        <div className="cart-drawer__header">
          <div>
            <p className="store-eyebrow">Your cart</p>
            <h2>{items.length ? `${items.length} ${items.length === 1 ? "item" : "items"}` : "Empty"}</h2>
          </div>
          <button type="button" onClick={closeCart}>Close</button>
        </div>

        <div className="cart-drawer__items">
          {items.length ? items.map((item) => (
            <article key={`${item.productId}:${item.variantId ?? "base"}`} className="cart-line">
              <div className="cart-line__media">
                {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <div className="cart-line__placeholder" />}
              </div>
              <div className="cart-line__body">
                <div className="cart-line__top">
                  <div>
                    <h3>{item.name}</h3>
                    {item.color ? <p>Color: {item.color}</p> : null}
                    {item.size ? <p>Size: {item.size}</p> : null}
                  </div>
                  <strong>${((item.unitPrice * item.quantity) / 100).toFixed(2)}</strong>
                </div>
                <div className="cart-line__bottom">
                  <div className="cart-qty" aria-label={`Quantity for ${item.name}`}>
                    <button type="button" onClick={() => setQuantity(item.productId, item.variantId, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => setQuantity(item.productId, item.variantId, item.quantity + 1)} aria-label="Increase quantity">+</button>
                  </div>
                  <button type="button" className="cart-line__remove" onClick={() => removeItem(item.productId, item.variantId)}>Remove</button>
                </div>
              </div>
            </article>
          )) : (
            <div className="cart-drawer__empty">
              <h3>Your cart is empty.</h3>
              <p>Pick something good. The rack is this way.</p>
              <button type="button" className="store-button" onClick={closeCart}>Continue shopping</button>
            </div>
          )}
        </div>

        {items.length ? (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__subtotal">
              <span>Subtotal</span>
              <strong>${(subtotal / 100).toFixed(2)}</strong>
            </div>
            <p>Shipping and taxes are calculated at checkout.</p>
            <Link href="/cart" className="cart-drawer__checkout" onClick={closeCart}>Checkout</Link>
            <button type="button" className="cart-drawer__continue" onClick={closeCart}>Continue shopping</button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
