"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

const VendorInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  website: z.string().trim().max(500).optional(),
  contactName: z.string().trim().max(160).optional(),
  contactEmail: z.union([z.literal(""), z.string().trim().email().max(320)]),
  contactPhone: z.string().trim().max(80).optional(),
  addressLine1: z.string().trim().max(160).optional(),
  addressLine2: z.string().trim().max(160).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().length(2),
  accountReference: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(3000).optional(),
  active: z.boolean(),
});

function parseVendor(formData: FormData) {
  return VendorInput.parse({
    id: String(formData.get("id") ?? "") || undefined,
    name: formData.get("name"),
    website: String(formData.get("website") ?? "") || undefined,
    contactName: String(formData.get("contactName") ?? "") || undefined,
    contactEmail: String(formData.get("contactEmail") ?? ""),
    contactPhone: String(formData.get("contactPhone") ?? "") || undefined,
    addressLine1: String(formData.get("addressLine1") ?? "") || undefined,
    addressLine2: String(formData.get("addressLine2") ?? "") || undefined,
    city: String(formData.get("city") ?? "") || undefined,
    state: String(formData.get("state") ?? "") || undefined,
    postalCode: String(formData.get("postalCode") ?? "") || undefined,
    country: String(formData.get("country") ?? "US").toUpperCase(),
    accountReference: String(formData.get("accountReference") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "") || undefined,
    active: formData.get("active") === "on",
  });
}

function vendorValues(input: z.infer<typeof VendorInput>) {
  return {
    name: input.name,
    website: input.website ?? null,
    contact_name: input.contactName ?? null,
    contact_email: input.contactEmail || null,
    contact_phone: input.contactPhone ?? null,
    address_line1: input.addressLine1 ?? null,
    address_line2: input.addressLine2 ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    postal_code: input.postalCode ?? null,
    country: input.country,
    account_reference: input.accountReference ?? null,
    notes: input.notes ?? null,
    active: input.active,
    updated_at: new Date().toISOString(),
  };
}

export async function createVendor(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = parseVendor(formData);

  const { error } = await supabase.from("vendors").insert(vendorValues(input));
  if (error) throw new Error(error.code === "23505" ? "That vendor name already exists." : "Unable to create vendor.");

  revalidatePath("/admin/vendors");
  revalidatePath("/admin/templates");
  revalidatePath("/admin/products");
}

export async function updateVendor(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = parseVendor(formData);
  if (!input.id) throw new Error("Vendor ID is required.");

  const { error } = await supabase.from("vendors").update(vendorValues(input)).eq("id", input.id);
  if (error) throw new Error(error.code === "23505" ? "That vendor name already exists." : "Unable to update vendor.");

  revalidatePath("/admin/vendors");
  revalidatePath("/admin/templates");
  revalidatePath("/admin/products");
}
