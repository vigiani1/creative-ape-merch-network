"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";

const VariantRow = z.object({
  variantGroup: z.string().trim().max(80).optional().default(""),
  size: z.string().trim().max(80).optional().default(""),
  color: z.string().trim().max(80).optional().default(""),
  skuSuffix: z.string().trim().max(80).optional().default(""),
  vendorPartNumber: z.string().trim().max(120).optional().default(""),
});

const NewMasterProduct = z.object({
  vendorId: z.string().uuid(),
  vendorPartNumber: z.string().trim().min(1).max(120),
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  skuPrefix: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  blankProductPrice: z.coerce.number().min(0).max(100000),
  productionMaterialPrice: z.coerce.number().min(0).max(100000),
  finishedSalePrice: z.coerce.number().min(0).max(100000),
  variantsJson: z.string(),
  customDataJson: z.string(),
  saveMode: z.enum(["library_only", "add_to_store"]),
  storeId: z.string().uuid().optional(),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120).optional(),
  revenueShareRate: z.union([z.literal(""), z.coerce.number().min(0).max(100)]),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
});

function cents(value: number) {
  return Math.round(value * 100);
}

export async function createMasterVendorProduct(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const input = NewMasterProduct.parse({
    vendorId: formData.get("vendorId"),
    vendorPartNumber: formData.get("vendorPartNumber"),
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    skuPrefix: String(formData.get("skuPrefix") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    blankProductPrice: formData.get("blankProductPrice"),
    productionMaterialPrice: formData.get("productionMaterialPrice"),
    finishedSalePrice: formData.get("finishedSalePrice"),
    variantsJson: String(formData.get("variantsJson") ?? "[]"),
    customDataJson: String(formData.get("customDataJson") ?? "{}"),
    saveMode: formData.get("saveMode"),
    storeId: String(formData.get("storeId") ?? "") || undefined,
    slug: String(formData.get("slug") ?? "") || undefined,
    revenueShareRate: String(formData.get("revenueShareRate") ?? ""),
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
  });

  const parsedJson: unknown = JSON.parse(input.variantsJson);
  const parsedCustomData: unknown = JSON.parse(input.customDataJson);
  if (!parsedCustomData || typeof parsedCustomData !== "object" || Array.isArray(parsedCustomData)) throw new Error("Invalid category product data.");
  const rawCustomData = parsedCustomData as Record<string, unknown>;
  const variants = z.array(VariantRow).max(500).parse(parsedJson).filter((row) =>
    Boolean(row.variantGroup || row.size || row.color || row.skuSuffix || row.vendorPartNumber)
  );

  const [{ data: category, error: categoryError }, { data: fieldDefinitions, error: fieldsError }, { data: existing, error: existingError }] = await Promise.all([
    supabase.from("product_categories").select("id,name").eq("id", input.categoryId).eq("active", true).single(),
    supabase.from("product_category_fields").select("field_key,field_type,required,hidden,options").eq("category_id", input.categoryId),
    supabase
      .from("product_templates")
      .select("id,name")
      .eq("vendor_id", input.vendorId)
      .ilike("vendor_part_number", input.vendorPartNumber)
      .maybeSingle(),
  ]);

  if (categoryError || !category) throw new Error("Product category not found.");
  if (fieldsError) throw new Error("Unable to load category field rules.");
  if (existingError) throw new Error("Unable to check the vendor product catalog.");
  if (existing) throw new Error(`That vendor part number is already saved as ${existing.name}. Select it from the saved product dropdown instead.`);

  const customData: Record<string, string | number | boolean> = {};
  for (const field of fieldDefinitions ?? []) {
    if (field.hidden) continue;
    const value = rawCustomData[field.field_key];
    const empty = value === undefined || value === null || value === "";
    if (field.required && empty) throw new Error(`${field.field_key.replaceAll("_"," ")} is required.`);
    if (empty) continue;

    if (field.field_type === "boolean") {
      customData[field.field_key] = value === true || value === "true";
    } else if (field.field_type === "number") {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) throw new Error(`${field.field_key.replaceAll("_"," ")} must be a number.`);
      customData[field.field_key] = numeric;
    } else {
      const text = String(value).trim();
      if (field.field_type === "select" && field.options.length && !field.options.includes(text)) {
        throw new Error(`Invalid option for ${field.field_key.replaceAll("_"," ")}.`);
      }
      customData[field.field_key] = text;
    }
  }

  const { data: template, error: templateError } = await supabase
    .from("product_templates")
    .insert({
      name: input.name,
      sku_prefix: input.skuPrefix ?? null,
      description: input.description ?? null,
      category_id: category.id,
      category: category.name,
      vendor_id: input.vendorId,
      vendor_part_number: input.vendorPartNumber,
      blank_product_cost: cents(input.blankProductPrice),
      production_material_cost: cents(input.productionMaterialPrice),
      finished_sale_price: cents(input.finishedSalePrice),
      base_production_cost: cents(input.blankProductPrice + input.productionMaterialPrice),
      custom_data: customData,
      active: true,
    })
    .select("id")
    .single();

  if (templateError || !template) {
    throw new Error(templateError?.code === "23505"
      ? "That vendor and part number combination is already in the master product library."
      : "Unable to save the master vendor product.");
  }

  if (variants.length) {
    const { error: variantsError } = await supabase.from("product_template_variants").insert(
      variants.map((row) => ({
        product_template_id: template.id,
        variant_group: row.variantGroup || null,
        size: row.size || null,
        color: row.color || null,
        sku_suffix: row.skuSuffix || null,
        vendor_part_number: row.vendorPartNumber || null,
        availability_status: "available",
        show_on_card: true,
        stackable: true,
        compressible: false,
        ships_alone: false,
      }))
    );
    if (variantsError) {
      await supabase.from("product_templates").delete().eq("id", template.id);
      throw new Error("Unable to save the product-specific variants.");
    }
  }

  if (input.saveMode === "library_only") {
    revalidatePath("/admin/onboarding");
    revalidatePath("/admin/templates");
    redirect(`/admin/onboarding?saved=${template.id}`);
  }

  if (!input.storeId || !input.slug) throw new Error("Choose a store and product slug to add this product to a store.");

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id,organization_id,slug")
    .eq("id", input.storeId)
    .single();
  if (storeError || !store) throw new Error("Store not found.");

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      organization_id: store.organization_id,
      store_id: store.id,
      product_template_id: template.id,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      sku: input.skuPrefix ?? null,
      category: category.name,
      status: input.status,
      retail_price: cents(input.finishedSalePrice),
      production_cost: cents(input.blankProductPrice + input.productionMaterialPrice),
      default_revenue_share_rate: input.revenueShareRate === "" ? null : input.revenueShareRate,
      featured: input.featured,
      vendor_id: input.vendorId,
      vendor_part_number: input.vendorPartNumber,
      custom_overrides: {},
    })
    .select("id")
    .single();

  if (productError || !product) {
    throw new Error(productError?.code === "23505" ? "That product slug is already used in this store." : "The master product was saved, but it could not be added to the store.");
  }

  if (variants.length) {
    const { error: productVariantsError } = await supabase.from("product_variants").insert(
      variants.map((row) => ({
        organization_id: store.organization_id,
        product_id: product.id,
        variant_group: row.variantGroup || null,
        size: row.size || null,
        color: row.color || null,
        sku: [input.skuPrefix, row.skuSuffix].filter(Boolean).join("-") || null,
        vendor_part_number: row.vendorPartNumber || null,
        inventory_quantity: null,
        availability_status: "available",
        show_on_card: true,
        stackable: true,
        compressible: false,
        ships_alone: false,
      }))
    );
    if (productVariantsError) {
      await supabase.from("products").delete().eq("id", product.id);
      throw new Error("The master product was saved, but the storefront variants could not be created.");
    }
  }

  revalidatePath("/admin/onboarding");
  revalidatePath("/admin/templates");
  revalidatePath("/admin/products");
  revalidatePath(`/shop/${store.slug}`);
  redirect(`/admin/products/${product.id}`);
}
