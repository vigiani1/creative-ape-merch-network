import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const Body = z.object({
  storeSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  customerName: z.string().trim().min(2).max(160),
  customerEmail: z.string().trim().email().max(320),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(25),
  })).min(1).max(100),
}).superRefine(({ items }, context) => {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.productId)) {
      context.addIssue({ code: "custom", message: "Each product may appear only once", path: ["items"] });
      return;
    }
    ids.add(item.productId);
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
      ? "Check the customer details and cart items."
      : error instanceof Error
        ? error.message
        : "Unable to create test order.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
