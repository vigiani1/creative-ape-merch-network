import { requireSuperAdmin } from "@/lib/auth";
import { ProductOnboardingForm } from "./product-onboarding-form";

export default async function ProductOnboardingPage() {
  const { supabase } = await requireSuperAdmin();

  const [
    { data: vendors, error: vendorError },
    { data: categories, error: categoryError },
    { data: templates, error: templateError },
    { data: variants, error: variantError },
    { data: stores, error: storeError },
  ] = await Promise.all([
    supabase.from("vendors").select("id,name").eq("active", true).order("name"),
    supabase
      .from("product_categories")
      .select("id,name,uses_variant_group,variant_group_label,uses_size,size_label,uses_color,color_label,default_variant_groups,default_sizes,default_colors")
      .eq("active", true)
      .order("name"),
    supabase
      .from("product_templates")
      .select("id,name,vendor_id,vendor_part_number,category_id,category,description,sku_prefix,finished_sale_price")
      .eq("active", true)
      .order("name"),
    supabase
      .from("product_template_variants")
      .select("id,product_template_id,variant_group,size,color,sku_suffix,vendor_part_number")
      .order("created_at"),
    supabase
      .from("stores")
      .select("id,name,status,organizations:organizations!stores_organization_id_fkey(name)")
      .neq("status", "archived")
      .order("name"),
  ]);

  if (vendorError || categoryError || templateError || variantError || storeError) {
    throw new Error("Unable to load product onboarding.");
  }

  const variantsByTemplate = new Map<string, {
    id: string;
    variantGroup: string;
    size: string;
    color: string;
    skuSuffix: string;
    vendorPartNumber: string;
  }[]>();

  for (const variant of variants ?? []) {
    const list = variantsByTemplate.get(variant.product_template_id) ?? [];
    list.push({
      id: variant.id,
      variantGroup: variant.variant_group ?? "",
      size: variant.size ?? "",
      color: variant.color ?? "",
      skuSuffix: variant.sku_suffix ?? "",
      vendorPartNumber: variant.vendor_part_number ?? "",
    });
    variantsByTemplate.set(variant.product_template_id, list);
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Guided workflow</p>
        <h1 className="mt-1 text-3xl font-black">Product onboarding</h1>
        <p className="mt-2 max-w-4xl text-sm text-black/55">
          Choose a vendor, then a saved vendor part number. Saved products remember their exact applicable variants. New products show only the variant fields configured for their category.
        </p>
      </div>

      <ProductOnboardingForm
        vendors={(vendors ?? []).map((vendor) => ({ id: vendor.id, name: vendor.name }))}
        categories={(categories ?? []).map((category) => ({
          ...category,
          default_variant_groups: category.default_variant_groups ?? [],
          default_sizes: category.default_sizes ?? [],
          default_colors: category.default_colors ?? [],
        }))}
        templates={(templates ?? []).map((template) => ({
          ...template,
          variants: variantsByTemplate.get(template.id) ?? [],
        }))}
        stores={(stores ?? []).map((store) => {
          const org = Array.isArray(store.organizations) ? store.organizations[0] : store.organizations;
          return {
            id: store.id,
            name: store.name,
            organizationName: org?.name ?? "Unknown organization",
          };
        })}
      />
    </div>
  );
}
