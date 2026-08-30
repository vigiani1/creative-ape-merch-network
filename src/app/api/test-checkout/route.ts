import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const ShippingAddress = z.object({
  line1: z.string().trim().min(2).max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  postal_code: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2).default("US"),
});

const Body = z.object({
  storeSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  customerName: z.string().trim().min(2).max(160),
  customerEmail: z.string().trim().email().max(320),
  shippingAddress: ShippingAddress,
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable().optional(),
    quantity: z.number().int().min(1).max(25),
  })).min(1).max(100),
}).superRefine(({ items }, context) => {
  const ids = new Set<string>();
  for (const item of items) {
    const key = `${item.productId}:${item.variantId ?? "base"}`;
    if (ids.has(key)) {
      context.addIssue({ code: "custom", message: "Each cart option may appear only once", path: ["items"] });
      return;
    }
    ids.add(key);
  }
});

export async function POST(request: Request) {
  try {
    const input = Body.parse(await request.json());
    const admin = createAdminClient();

    const { data, error } = await (admin.rpc as any)("create_test_order", {
      store_slug: input.storeSlug,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      shipping_address: {
        ...input.shippingAddress,
        line2: input.shippingAddress.line2 || null,
      },
      items: input.items,
    });

    if (error) throw error;

    const order = Array.isArray(data) ? data[0] : data;
    if (!order?.order_number) throw new Error("Test order was not created.");

    return NextResponse.json({
      ok: true,
      orderId: order.order_id,
      orderNumber: order.order_number,
      grandTotal: Number(order.grand_total ?? 0),
      paymentProcessed: false,
      testMode: true,
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Check the customer, shipping address, and cart details."
      : error instanceof Error
        ? error.message
        : "Unable to create test order.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
