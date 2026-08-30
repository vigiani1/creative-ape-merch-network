"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

function dollarsToCents(value: number) { return Math.round(value * 100); }
function optionalCents(value: "" | number) { return value === "" ? null : dollarsToCents(value); }
function optionalNumber(value: "" | number) { return value === "" ? null : value; }

const TemplateInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  skuPrefix: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(80).optional(),
  blankProductPrice: z.coerce.number().min(0).max(100000),
  productionMaterialPrice: z.coerce.number().min(0).max(100000),
  finishedSalePrice: z.coerce.number().min(0).max(100000),
  vendorId: z.union([z.literal(""), z.string().uuid()]),
  vendorPartNumber: z.string().trim().max(120).optional(),
  active: z.boolean(),
});

function parseTemplate(formData: FormData) {
  return TemplateInput.parse({
    id: String(formData.get("id") ?? "") || undefined,
    name: formData.get("name"),
    skuPrefix: String(formData.get("skuPrefix") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    category: String(formData.get("category") ?? "") || undefined,
    blankProductPrice: formData.get("blankProductPrice"),
    productionMaterialPrice: formData.get("productionMaterialPrice"),
    finishedSalePrice: formData.get("finishedSalePrice"),
    vendorId: String(formData.get("vendorId") ?? ""),
    vendorPartNumber: String(formData.get("vendorPartNumber") ?? "") || undefined,
    active: formData.get("active") === "on",
  });
}

function templateValues(input: z.infer<typeof TemplateInput>) {
  return {
    name: input.name,
    sku_prefix: input.skuPrefix ?? null,
    description: input.description ?? null,
    category: input.category ?? null,
    blank_product_cost: dollarsToCents(input.blankProductPrice),
    production_material_cost: dollarsToCents(input.productionMaterialPrice),
    finished_sale_price: dollarsToCents(input.finishedSalePrice),
    base_production_cost: dollarsToCents(input.blankProductPrice + input.productionMaterialPrice),
    vendor_id: input.vendorId || null,
    vendor_part_number: input.vendorPartNumber ?? null,
    active: input.active,
  };
}

export async function createTemplate(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = parseTemplate(formData);
  const { error } = await supabase.from("product_templates").insert(templateValues(input));
  if (error) throw new Error("Unable to create product template.");
  revalidatePath("/admin/templates");
}

export async function updateTemplate(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = parseTemplate(formData);
  if (!input.id) throw new Error("Template ID is required.");
  const { error } = await supabase.from("product_templates").update(templateValues(input)).eq("id", input.id);
  if (error) throw new Error("Unable to update product template.");
  revalidatePath("/admin/templates");
}

const VariantInput = z.object({
  templateId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  variantGroup: z.string().trim().max(80).optional(),
  size: z.string().trim().max(80).optional(),
  color: z.string().trim().max(80).optional(),
  skuSuffix: z.string().trim().max(80).optional(),
  vendorPartNumber: z.string().trim().max(120).optional(),
  priceOverride: z.union([z.literal(""), z.coerce.number().min(0).max(100000)]),
  costOverride: z.union([z.literal(""), z.coerce.number().min(0).max(100000)]),
  weightOz: z.union([z.literal(""), z.coerce.number().min(0).max(10000)]),
  lengthIn: z.union([z.literal(""), z.coerce.number().min(0).max(500)]),
  widthIn: z.union([z.literal(""), z.coerce.number().min(0).max(500)]),
  heightIn: z.union([z.literal(""), z.coerce.number().min(0).max(500)]),
  packagingClass: z.string().trim().max(80).optional(),
  showOnCard: z.boolean(),
  stackable: z.boolean(),
  compressible: z.boolean(),
  shipsAlone: z.boolean(),
  availabilityStatus: z.enum(["available","unavailable","discontinued"]),
});

function parseVariant(formData: FormData) {
  return VariantInput.parse({
    templateId: formData.get("templateId"),
    variantId: String(formData.get("variantId") ?? "") || undefined,
    variantGroup: String(formData.get("variantGroup") ?? "") || undefined,
    size: String(formData.get("size") ?? "") || undefined,
    color: String(formData.get("color") ?? "") || undefined,
    skuSuffix: String(formData.get("skuSuffix") ?? "") || undefined,
    vendorPartNumber: String(formData.get("vendorPartNumber") ?? "") || undefined,
    priceOverride: String(formData.get("priceOverride") ?? ""),
    costOverride: String(formData.get("costOverride") ?? ""),
    weightOz: String(formData.get("weightOz") ?? ""),
    lengthIn: String(formData.get("lengthIn") ?? ""),
    widthIn: String(formData.get("widthIn") ?? ""),
    heightIn: String(formData.get("heightIn") ?? ""),
    packagingClass: String(formData.get("packagingClass") ?? "") || undefined,
    showOnCard: formData.get("showOnCard") === "on",
    stackable: formData.get("stackable") === "on",
    compressible: formData.get("compressible") === "on",
    shipsAlone: formData.get("shipsAlone") === "on",
    availabilityStatus: formData.get("availabilityStatus"),
  });
}

function variantValues(input: z.infer<typeof VariantInput>) {
  return {
    variant_group: input.variantGroup ?? null,
    size: input.size ?? null,
    color: input.color ?? null,
    sku_suffix: input.skuSuffix ?? null,
    vendor_part_number: input.vendorPartNumber ?? null,
    price_override: optionalCents(input.priceOverride),
    production_cost_override: optionalCents(input.costOverride),
    weight_oz: optionalNumber(input.weightOz),
    length_in: optionalNumber(input.lengthIn),
    width_in: optionalNumber(input.widthIn),
    height_in: optionalNumber(input.heightIn),
    packaging_class: input.packagingClass ?? null,
    show_on_card: input.showOnCard,
    stackable: input.stackable,
    compressible: input.compressible,
    ships_alone: input.shipsAlone,
    availability_status: input.availabilityStatus,
  };
}

export async function createTemplateVariant(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = parseVariant(formData);
  if (!input.variantGroup && !input.size && !input.color && !input.skuSuffix) throw new Error("Add a variant group, size, color, or SKU suffix.");

  const { error } = await supabase.from("product_template_variants").insert({
    product_template_id: input.templateId,
    ...variantValues(input),
  });
  if (error) throw new Error("Unable to create template variant.");
  revalidatePath("/admin/templates");
}

export async function updateTemplateVariant(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = parseVariant(formData);
  if (!input.variantId) throw new Error("Variant ID is required.");

  const { error } = await supabase.from("product_template_variants")
    .update(variantValues(input))
    .eq("id", input.variantId)
    .eq("product_template_id", input.templateId);

  if (error) throw new Error("Unable to update template variant.");
  revalidatePath("/admin/templates");
}

export async function deleteTemplateVariant(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = z.object({ templateId: z.string().uuid(), variantId: z.string().uuid() }).parse({
    templateId: formData.get("templateId"),
    variantId: formData.get("variantId"),
  });
  const { error } = await supabase.from("product_template_variants").delete().eq("id", input.variantId).eq("product_template_id", input.templateId);
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
    supabase.from("product_templates").select("id,sku_prefix,description,category,base_production_cost,finished_sale_price,vendor_id,vendor_part_number").eq("id", input.templateId).single(),
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
    vendor_id: template.vendor_id,
    vendor_part_number: template.vendor_part_number,
  }).select("id").single();

  if (productError || !product) throw new Error(productError?.code === "23505" ? "That product slug is already used in this store." : "Unable to clone template.");

  const { data: templateVariants, error: variantsError } = await supabase.from("product_template_variants")
    .select("variant_group,size,color,sku_suffix,vendor_part_number,price_override,production_cost_override,availability_status,show_on_card,weight_oz,length_in,width_in,height_in,packaging_class,stackable,compressible,ships_alone")
    .eq("product_template_id", template.id).order("created_at");
  if (variantsError) throw new Error("Product was created, but template variants could not be loaded.");

  if (templateVariants?.length) {
    const { error } = await supabase.from("product_variants").insert(templateVariants.map((variant) => ({
      organization_id: store.organization_id,
      product_id: product.id,
      variant_group: variant.variant_group,
      size: variant.size,
      color: variant.color,
      sku: [template.sku_prefix, variant.sku_suffix].filter(Boolean).join("-") || null,
      vendor_part_number: variant.vendor_part_number,
      price_override: variant.price_override,
      production_cost_override: variant.production_cost_override,
      inventory_quantity: null,
      availability_status: variant.availability_status,
      show_on_card: variant.show_on_card,
      weight_oz: variant.weight_oz,
      length_in: variant.length_in,
      width_in: variant.width_in,
      height_in: variant.height_in,
      packaging_class: variant.packaging_class,
      stackable: variant.stackable,
      compressible: variant.compressible,
      ships_alone: variant.ships_alone,
    })));
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
