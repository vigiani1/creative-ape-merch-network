import type { Metadata } from "next";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/components/cart/cart-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Creative Ape Merch Network",
    template: "%s | Creative Ape Merch Network",
  },
  description: "Multi-tenant merchandise storefronts powered by Creative Ape Branding.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <CartProvider>
          <div id="main-content">{children}</div>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
