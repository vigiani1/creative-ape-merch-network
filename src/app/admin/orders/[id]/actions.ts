"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

const UpdateOrder = z.object({
  orderId: z.string().uuid(),
  customerName: z.string().trim().min(2).max(160),
  customerEmail: z.string().trim().email().max(320),
  line1: z.string().trim().min(2).max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2),
});

export async function updateOrderCustomer(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = UpdateOrder.parse({
    orderId: formData.get("orderId"),
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    line1: formData.get("line1"),
    line2: String(formData.get("line2") ?? "") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: String(formData.get("country") ?? "US").toUpperCase(),
  });

  const { error } = await supabase
    .from("orders")
    .update({
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      shipping_address: {
        line1: input.line1,
        line2: input.line2 ?? null,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
        country: input.country,
      },
    })
    .eq("id", input.orderId);

  if (error) throw new Error("Unable to update customer or shipping information.");

  revalidatePath(`/admin/orders/${input.orderId}`);
}

const AddNote = z.object({
  orderId: z.string().uuid(),
  visibility: z.enum(["internal", "organization"]),
  note: z.string().trim().min(1).max(2000),
});

export async function addOrderNote(formData: FormData) {
  const { supabase, userId } = await requireSuperAdmin();
  const input = AddNote.parse({
    orderId: formData.get("orderId"),
    visibility: formData.get("visibility"),
    note: formData.get("note"),
  });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,organization_id")
    .eq("id", input.orderId)
    .single();

  if (orderError || !order) throw new Error("Order not found.");

  const { error } = await supabase.from("order_notes").insert({
    organization_id: order.organization_id,
    order_id: order.id,
    visibility: input.visibility,
    note: input.note,
    created_by: userId,
  });

  if (error) throw new Error("Unable to add order note.");

  revalidatePath(`/admin/orders/${input.orderId}`);
  if (input.visibility === "organization") revalidatePath(`/portal/orders/${input.orderId}`);
}
