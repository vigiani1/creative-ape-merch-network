import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import type { PublicProduct, PublicStore } from "@/lib/supabase/public-types";

const Body = z.object({
  storeSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(25) })).min(1).max(100),
}).superRefine(({ items }, context) => {
  const productIds = new Set<string>();
  for (const item of items) {
    if (productIds.has(item.productId)) {
      context.addIssue({ code: "custom", message: "Each product may appear only once", path: ["items"] });
      return;
    }
    productIds.add(item.productId);
  }
});

export async function POST(request: Request) {
  try {
    const input = Body.parse(await request.json());
    const supabase = await createClient();
    const { data: stores } = await supabase.rpc("get_public_store", { store_slug: input.storeSlug });
    const store = stores?.[0] as PublicStore | undefined;
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const { data: products, error } = await supabase.rpc("get_public_store_products", { target_store_id: store.id });
    if (error || !products) return NextResponse.json({ error: "Unable to load store products" }, { status: 400 });

    const productMap = new Map((products as PublicProduct[]).map((product) => [product.id, product]));
    const lineItems = input.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error("One or more products are unavailable");
      return {
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Number(product.retail_price),
          product_data: { name: product.name },
        },
      };
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/shop/${store.slug}?checkout=success`,
      cancel_url: `${origin}/cart?checkout=cancelled`,
      metadata: { store_id: store.id, store_slug: store.slug },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Invalid checkout request"
      : error instanceof Error && error.message === "One or more products are unavailable"
        ? error.message
        : "Unable to create checkout session";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
