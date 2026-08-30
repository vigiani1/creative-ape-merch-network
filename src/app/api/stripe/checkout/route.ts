import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

const Body = z.object({
  storeSlug: z.string().min(1),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(25) })).min(1),
});

export async function POST(request: Request) {
  try {
    const input = Body.parse(await request.json());
    const supabase = await createClient();
    const { data: store } = await supabase.from("stores").select("id,slug").eq("slug", input.storeSlug).eq("status", "published").maybeSingle();
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const ids = [...new Set(input.items.map((item) => item.productId))];
    const { data: products, error } = await supabase.from("products").select("id,name,retail_price").eq("store_id", store.id).eq("status", "published").in("id", ids);
    if (error || !products || products.length !== ids.length) return NextResponse.json({ error: "One or more products are unavailable" }, { status: 400 });

    const productMap = new Map(products.map((product) => [product.id, product]));
    const lineItems = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      return { quantity: item.quantity, price_data: { currency: "usd", unit_amount: Number(product.retail_price), product_data: { name: product.name } } };
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/shop/${store.slug}?checkout=success`,
      cancel_url: `${origin}/shop/${store.slug}?checkout=cancelled`,
      metadata: { store_id: store.id, store_slug: store.slug },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout session";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
