"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

function dollarsToCents(value: number) {
  return Math.round(value * 100);
}

const CreateTemplate = z.object({
  name: z.string().trim().min(2).max(160),
  skuPrefix: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(80).optional(),
  baseProductionCost: z.coerce.number().min(0).max(100000),
  active: z.boolean(),
});

export async function createTemplate(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = CreateTemplate.parse({
    name: formData.get("name"),
    skuPrefix: String(formData.get("skuPrefix") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    category: String(formData.get("category") ?? "") || undefined,
    baseProductionCost: formData.get("baseProductionCost"),
    active: formData.get("active") === "on",
  });

  const { error } = await supabase.from("product_templates").insert({
    name: input.name,
    sku_prefix: input.skuPrefix ?? null,
    description: input.description ?? null,
    category: input.category ?? null,
    base_production_cost: dollarsToCents(input.baseProductionCost),
    active: input.active,
  });

  if (error) throw new Error("Unable to create product template.");
  revalidatePath("/admin/templates");
}

const UpdateTemplate = CreateTemplate.extend({ id: z.string().uuid() });

export async function updateTemplate(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = UpdateTemplate.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    skuPrefix: String(formData.get("skuPrefix") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    category: String(formData.get("category") ?? "") || undefined,
    baseProductionCost: formData.get("baseProductionCost"),
    active: formData.get("active") === "on",
  });

  const { error } = await supabase.from("product_templates").update({
    name: input.name,
    sku_prefix: input.skuPrefix ?? null,
    description: input.description ?? null,
    category: input.category ?? null,
    base_production_cost: dollarsToCents(input.baseProductionCost),
    active: input.active,
  }).eq("id", input.id);

  if (error) throw new Error("Unable to update product template.");
  revalidatePath("/admin/templates");
}

const TemplateVariant = z.object({
  templateId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  size: z.string().trim().max(80).optional(),
  color: z.string().trim().max(80).optional(),
  skuSuffix: z.string().trim().max(80).optional(),
  priceOverride: z.union([z.literal(""), z.coerce.number().min(0).max(100000)]),
  costOverride: z.union([z.literal(""), z.coerce.number().min(0).max(100000)]),
  availabilityStatus: z.enum(["available","unavailable","discontinued"]),
});

function optionalCents(value: "" | number) {
  return value === "" ? null : dollarsToCents(value);
}

export async function createTemplateVariant(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = TemplateVariant.parse({
    templateId: formData.get("templateId"),
    size: String(formData.get("size") ?? "") || undefined,
    color: String(formData.get("color") ?? "") || undefined,
    skuSuffix: String(formData.get("skuSuffix") ?? "") || undefined,
    priceOverride: String(formData.get("priceOverride") ?? ""),
    costOverride: String(formData.get("costOverride") ?? ""),
    availabilityStatus: formData.get("availabilityStatus"),
  });

  if (!input.size && !input.color && !input.skuSuffix) throw new Error("Add a size, color, or SKU suffix.");

  const { error } = await supabase.from("product_template_variants").insert({
    product_template_id: input.templateId,
    size: input.size ?? null,
    color: input.color ?? null,
    sku_suffix: input.skuSuffix ?? null,
    price_override: optionalCents(input.priceOverride),
    production_cost_override: optionalCents(input.costOverride),
    availability_status: input.availabilityStatus,
  });

  if (error) throw new Error("Unable to create template variant.");
  revalidatePath("/admin/templates");
}

export async function deleteTemplateVariant(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = z.object({
    templateId: z.string().uuid(),
    variantId: z.string().uuid(),
  }).parse({
    templateId: formData.get("templateId"),
    variantId: formData.get("variantId"),
  });

  const { error } = await supabase
    .from("product_template_variants")
    .delete()
    .eq("id", input.variantId)
    .eq("product_template_id", input.templateId);

  if (error) throw new Error("Unable to delete template variant.");
  revalidatePath("/admin/templates");
}

const CloneTemplate = z.object({
  templateId: z.string().uuid(),
  storeId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  retailPrice: z.coerce.number().min(0).max(100000),
  revenueShareRate: z.union([z.literal(""), z.coerce.number().min(0).max(100)]),
  status: z.enum(["draft","published"]),
  featured: z.boolean(),
});

export async function cloneTemplateToStore(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = CloneTemplate.parse({
    templateId: formData.get("templateId"),
    storeId: formData.get("storeId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    retailPrice: formData.get("retailPrice"),
    revenueShareRate: String(formData.get("revenueShareRate") ?? ""),
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
  });

  const [{ data: template, error: templateError }, { data: store, error: storeError }] = await Promise.all([
    supabase.from("product_templates").select("id,name,sku_prefix,description,category,base_production_cost").eq("id", input.templateId).single(),
    supabase.from("stores").select("id,organization_id,slug").eq("id", input.storeId).single(),
  ]);

  if (templateError || !template) throw new Error("Template not found.");
  if (storeError || !store) throw new Error("Store not found.");

  const { data: product, error: productError } = await supabase.from("products").insert({
    organization_id: store.organization_id,
    store_id: store.id,
    product_template_id: template.id,
    name: input.name,
    slug: input.slug,
    description: template.description,
    sku: template.sku_prefix,
    category: template.category,
    status: input.status,
    retail_price: dollarsToCents(input.retailPrice),
    production_cost: template.base_production_cost,
    default_revenue_share_rate: input.revenueShareRate === "" ? null : input.revenueShareRate,
    featured: input.featured,
  }).select("id").single();

  if (productError || !product) {
    throw new Error(productError?.code === "23505" ? "That product slug is already used in this store." : "Unable to clone template.");
  }

  const { data: templateVariants, error: variantsError } = await supabase
    .from("product_template_variants")
    .select("size,color,sku_suffix,price_override,production_cost_override,availability_status")
    .eq("product_template_id", template.id)
    .order("created_at");

  if (variantsError) throw new Error("Product was created, but template variants could not be loaded.");

  if (templateVariants?.length) {
    const { error } = await supabase.from("product_variants").insert(
      templateVariants.map((variant) => ({
        organization_id: store.organization_id,
        product_id: product.id,
        size: variant.size,
        color: variant.color,
        sku: [template.sku_prefix, variant.sku_suffix].filter(Boolean).join("-") || null,
        price_override: variant.price_override,
        production_cost_override: variant.production_cost_override,
        inventory_quantity: null,
        availability_status: variant.availability_status,
      }))
    );

    if (error) {
      await supabase.from("products").delete().eq("id", product.id);
      throw new Error("Unable to clone template variants.");
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/templates");
  revalidatePath(`/shop/${store.slug}`);
  redirect(`/admin/products/${product.id}`);
}
