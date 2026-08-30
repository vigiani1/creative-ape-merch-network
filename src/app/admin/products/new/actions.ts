"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

const Input = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(3000).optional(),
  categoryId: z.union([z.literal(""), z.string().uuid()]),
  price: z.coerce.number().min(0).max(100000),
  cost: z.union([z.literal(""), z.coerce.number().min(0).max(100000)]),
  status: z.enum(["draft","published"]),
  featured: z.boolean(),
  colorsJson: z.string(),
  productImageAssetId: z.string().uuid().optional(),
});

function dollarsToCents(value: number) {
  return Math.round(value * 100);
}

export async function createMerchandisingProduct(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const input = Input.parse({
    organizationId: formData.get("organizationId"),
    storeId: formData.get("storeId"),
    name: formData.get("name"),
    description: String(formData.get("description") ?? "") || undefined,
    categoryId: String(formData.get("categoryId") ?? ""),
    price: formData.get("price"),
    cost: String(formData.get("cost") ?? ""),
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
    colorsJson: String(formData.get("colorsJson") ?? "[]"),
    productImageAssetId: String(formData.get("productImageAssetId") ?? "") || undefined,
  });

  const sizes = formData.getAll("sizes").map(String).filter(Boolean);
  const collectionIds = formData.getAll("collectionIds").map(String).filter(Boolean);
  const parsedColors = z.array(z.object({
    name: z.string().trim().min(1).max(80),
    imageUrl: z.string().trim().max(1000).optional().default(""),
    displayOrder: z.number().int().min(0).max(999),
  })).max(50).parse(JSON.parse(input.colorsJson));

  const normalizedColors = [...new Map(
    parsedColors.map((color) => [color.name.toLowerCase(), color])
  ).values()];

  const { data: created, error: createError } = await supabase.rpc("create_admin_product_v2", {
    target_organization_id: input.organizationId,
    target_store_id: input.storeId,
    product_name: input.name,
    category_id_input: input.categoryId || undefined,
    price_cents: dollarsToCents(input.price),
    product_description: input.description,
  });

  if (createError || !created || typeof created !== "object" || Array.isArray(created)) {
    throw new Error(createError?.message || "Unable to create product.");
  }

  const createdProduct = (created as { product?: { id?: string } }).product;
  const productId = createdProduct?.id;
  if (!productId) throw new Error("Product was created without an ID.");

  const sizePayload = sizes.map((name, index) => ({
    name,
    displayOrder: (index + 1) * 10,
    active: true,
  }));

  const colorPayload = normalizedColors.map((color, index) => ({
    name: color.name,
    imageUrl: color.imageUrl || "",
    displayOrder: color.displayOrder || (index + 1) * 10,
    active: true,
  }));

  const { error: saveError } = await supabase.rpc("save_admin_product_merchandising_v2", {
    target_product_id: productId,
    product_data: {
      name: input.name,
      description: input.description || "",
      categoryId: input.categoryId || undefined,
      priceCents: dollarsToCents(input.price),
      costCents: input.cost === "" ? 0 : dollarsToCents(input.cost),
      status: input.status,
      featured: input.featured,
    },
    sizes: sizePayload,
    colors: colorPayload,
    inventory: [],
    store_ids: [input.storeId],
    collection_ids: collectionIds,
  });

  if (saveError) throw new Error(saveError.message || "Unable to save product merchandising.");

  if (input.productImageAssetId) {
    const { error: mediaError } = await supabase.rpc("save_admin_product_media_v2", {
      target_product_id: productId,
      media_items: [{
        mediaAssetId: input.productImageAssetId,
        isPrimary: true,
        displayOrder: 0,
        altText: input.name,
      }],
    });
    if (mediaError) throw new Error(mediaError.message || "Product was created, but the image could not be attached.");
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}?created=1`);
}
