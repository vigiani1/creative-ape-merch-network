"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

const CreateProduct = z.object({
  storeId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  description: z.string().trim().max(2000).optional(),
  sku: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  retailPrice: z.coerce.number().min(0).max(100000),
  productionCost: z.coerce.number().min(0).max(100000),
  revenueShareRate: z.union([z.literal(""), z.coerce.number().min(0).max(100)]),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
  sizes: z.string().max(500).optional(),
});

function dollarsToCents(value: number) {
  return Math.round(value * 100);
}

export async function createProduct(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const input = CreateProduct.parse({
    storeId: formData.get("storeId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: String(formData.get("description") ?? "") || undefined,
    sku: String(formData.get("sku") ?? "") || undefined,
    category: String(formData.get("category") ?? "") || undefined,
    retailPrice: formData.get("retailPrice"),
    productionCost: formData.get("productionCost"),
    revenueShareRate: String(formData.get("revenueShareRate") ?? ""),
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
    sizes: String(formData.get("sizes") ?? "") || undefined,
  });

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id,organization_id,slug")
    .eq("id", input.storeId)
    .single();

  if (storeError || !store) throw new Error("Store not found.");

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      organization_id: store.organization_id,
      store_id: store.id,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      sku: input.sku ?? null,
      category: input.category ?? null,
      status: input.status,
      retail_price: dollarsToCents(input.retailPrice),
      production_cost: dollarsToCents(input.productionCost),
      default_revenue_share_rate: input.revenueShareRate === "" ? null : input.revenueShareRate,
      featured: input.featured,
    })
    .select("id")
    .single();

  if (error || !product) {
    throw new Error(error?.code === "23505" ? "That product slug is already used in this store." : "Unable to create product.");
  }

  const sizes = [...new Set((input.sizes ?? "").split(",").map((value) => value.trim()).filter(Boolean))];
  if (sizes.length) {
    const { error: variantError } = await supabase.from("product_variants").insert(
      sizes.map((size, index) => ({
        organization_id: store.organization_id,
        product_id: product.id,
        size,
        sku: input.sku ? `${input.sku}-${size.replace(/\s+/g, "-").toUpperCase()}` : null,
        availability_status: "available" as const,
        inventory_quantity: null,
      }))
    );

    if (variantError) {
      await supabase.from("products").delete().eq("id", product.id);
      throw new Error("Unable to create product variants.");
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/shop/${store.slug}`);
  revalidatePath(`/shop/${store.slug}/products/${input.slug}`);
  redirect("/admin/products");
}
const UpdateProduct = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  description: z.string().trim().max(2000).optional(),
  sku: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  retailPrice: z.coerce.number().min(0).max(100000),
  productionCost: z.coerce.number().min(0).max(100000),
  revenueShareRate: z.union([z.literal(""), z.coerce.number().min(0).max(100)]),
  status: z.enum(["draft", "published", "archived"]),
  featured: z.boolean(),
});

export async function updateProduct(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const input = UpdateProduct.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: String(formData.get("description") ?? "") || undefined,
    sku: String(formData.get("sku") ?? "") || undefined,
    category: String(formData.get("category") ?? "") || undefined,
    retailPrice: formData.get("retailPrice"),
    productionCost: formData.get("productionCost"),
    revenueShareRate: String(formData.get("revenueShareRate") ?? ""),
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
  });

  const { data: current, error: currentError } = await supabase
    .from("products")
    .select("slug,stores(slug)")
    .eq("id", input.id)
    .single();

  if (currentError || !current) throw new Error("Product not found.");

  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      sku: input.sku ?? null,
      category: input.category ?? null,
      retail_price: dollarsToCents(input.retailPrice),
      production_cost: dollarsToCents(input.productionCost),
      default_revenue_share_rate: input.revenueShareRate === "" ? null : input.revenueShareRate,
      status: input.status,
      featured: input.featured,
    })
    .eq("id", input.id);

  if (error) throw new Error(error.code === "23505" ? "That product slug is already used in this store." : "Unable to update product.");

  const store = Array.isArray(current.stores) ? current.stores[0] : current.stores;
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${input.id}`);
  if (store?.slug) {
    revalidatePath(`/shop/${store.slug}`);
    revalidatePath(`/shop/${store.slug}/products/${current.slug}`);
    revalidatePath(`/shop/${store.slug}/products/${input.slug}`);
  }
  redirect("/admin/products");
}
