"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  productId: string;
  variantId?: string | null;
  variantLabel?: string;
  storeSlug: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  setQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "creative-ape-merch-cart";

function sameLine(a: Pick<CartItem, "productId" | "variantId">, b: Pick<CartItem, "productId" | "variantId">) {
  return a.productId === b.productId && (a.variantId ?? null) === (b.variantId ?? null);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as CartItem[];
          setItems(parsed.map((item) => ({ ...item, variantId: item.variantId ?? null })));
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    addItem(item) {
      setItems((current) => {
        const existing = current.find((entry) => sameLine(entry, item));
        if (existing) {
          return current.map((entry) =>
            sameLine(entry, item) ? { ...entry, quantity: Math.min(entry.quantity + 1, 25) } : entry
          );
        }
        const sameStoreItems = current.filter((entry) => entry.storeSlug === item.storeSlug);
        return [...sameStoreItems, { ...item, variantId: item.variantId ?? null, quantity: 1 }];
      });
    },
    setQuantity(productId, variantId, quantity) {
      setItems((current) => current.map((item) =>
        sameLine(item, { productId, variantId })
          ? { ...item, quantity: Math.max(1, Math.min(quantity, 25)) }
          : item
      ));
    },
    removeItem(productId, variantId) {
      setItems((current) => current.filter((item) => !sameLine(item, { productId, variantId })));
    },
    clear() { setItems([]); },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
