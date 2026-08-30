"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

const Input = z.object({
  productId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(3000).optional(),
  categoryId: z.union([z.literal(""), z.string().uuid()]),
  sku: z.string().trim().max(120).optional(),
  price: z.coerce.number().min(0).max(100000),
  cost: z.coerce.number().min(0).max(100000),
  status: z.enum(["draft","published","archived"]),
  featured: z.boolean(),
  sizesJson: z.string(),
  colorsJson: z.string(),
  inventoryJson: z.string(),
});

function dollarsToCents(value: number) {
  return Math.round(value * 100);
}

export async function saveProductEditorV2(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const input = Input.parse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    description: String(formData.get("description") ?? "") || undefined,
    categoryId: String(formData.get("categoryId") ?? ""),
    sku: String(formData.get("sku") ?? "") || undefined,
    price: formData.get("price"),
    cost: formData.get("cost"),
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
    sizesJson: String(formData.get("sizesJson") ?? "[]"),
    colorsJson: String(formData.get("colorsJson") ?? "[]"),
    inventoryJson: String(formData.get("inventoryJson") ?? "[]"),
  });

  const sizes = z.array(z.object({
    name: z.string().min(1).max(80),
    displayOrder: z.number().int(),
    active: z.boolean(),
  })).parse(JSON.parse(input.sizesJson));

  const colors = z.array(z.object({
    name: z.string().min(1).max(80),
    imageUrl: z.string().max(1000).optional().default(""),
    displayOrder: z.number().int(),
    active: z.boolean(),
  })).parse(JSON.parse(input.colorsJson));

  const inventory = z.array(z.object({
    size: z.string().optional().default(""),
    color: z.string().optional().default(""),
    quantity: z.number().int().min(0).nullable(),
    sku: z.string().max(120).optional().default(""),
    priceOverrideCents: z.number().int().min(0).nullable(),
  })).parse(JSON.parse(input.inventoryJson));

  const storeIds = formData.getAll("storeIds").map(String).filter(Boolean);
  const collectionIds = formData.getAll("collectionIds").map(String).filter(Boolean);

  const { error } = await supabase.rpc("save_admin_product_merchandising_v2", {
    target_product_id: input.productId,
    product_data: {
      name: input.name,
      description: input.description || "",
      sku: input.sku || "",
      categoryId: input.categoryId || undefined,
      priceCents: dollarsToCents(input.price),
      costCents: dollarsToCents(input.cost),
      status: input.status,
      featured: input.featured,
    },
    sizes,
    colors,
    inventory,
    store_ids: storeIds,
    collection_ids: collectionIds,
  });

  if (error) throw new Error(error.message || "Unable to save product.");

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${input.productId}`);
  redirect(`/admin/products/${input.productId}?saved=1`);
}
