"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

const UpdateFulfillment = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["paid", "processing", "production", "ready", "shipped", "complete", "cancelled", "refunded"]),
  notes: z.string().trim().max(500).optional(),
});

export async function updateFulfillment(formData: FormData) {
  const { supabase, userId } = await requireSuperAdmin();

  const input = UpdateFulfillment.parse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    notes: String(formData.get("notes") ?? "") || undefined,
  });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,organization_id")
    .eq("id", input.orderId)
    .single();

  if (orderError || !order) throw new Error("Order not found.");

  const { error: updateError } = await supabase
    .from("orders")
    .update({ fulfillment_status: input.status })
    .eq("id", input.orderId);

  if (updateError) throw new Error("Unable to update fulfillment status.");

  const { error: eventError } = await supabase.from("fulfillment_events").insert({
    organization_id: order.organization_id,
    order_id: order.id,
    status: input.status,
    notes: input.notes ?? null,
    created_by: userId,
  });

  if (eventError) throw new Error("Status changed, but the fulfillment history entry could not be recorded.");

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/fulfillment");
}
