import { requireSuperAdmin } from "@/lib/auth";
import { ProductOnboardingForm } from "./product-onboarding-form";

export default async function ProductOnboardingPage() {
  const { supabase } = await requireSuperAdmin();

  const [
    { data: vendors, error: vendorError },
    { data: categories, error: categoryError },
    { data: fields, error: fieldError },
    { data: templates, error: templateError },
    { data: variants, error: variantError },
    { data: templateColors, error: templateColorsError },
    { data: stores, error: storeError },
    { data: assets, error: assetsError },
  ] = await Promise.all([
    supabase.from("vendors").select("id,name").eq("active", true).order("name"),
    supabase
      .from("product_categories")
      .select("id,name,uses_variant_group,variant_group_label,uses_size,size_label,uses_color,color_label,default_variant_groups,default_sizes,default_colors")
      .eq("active", true)
      .order("name"),
    supabase
      .from("product_category_fields")
      .select("id,category_id,field_key,label,field_type,field_group,required,admin_only,hidden,display_order,options,placeholder,help_text")
      .order("field_group")
      .order("display_order"),
    supabase
      .from("product_templates")
      .select("id,name,vendor_id,vendor_part_number,category_id,category,description,sku_prefix,finished_sale_price,custom_data,primary_image_url,gallery_urls")
      .eq("active", true)
      .order("name"),
    supabase
      .from("product_template_variants")
      .select("id,product_template_id,size,color")
      .eq("show_on_card", true)
      .order("created_at"),
    supabase
      .from("product_template_color_options")
      .select("id,product_template_id,color_name,image_url,display_order")
      .eq("active", true)
      .order("display_order"),
    supabase
      .from("stores")
      .select("id,name,status,organizations:organizations!stores_organization_id_fkey(name)")
      .neq("status", "archived")
      .order("name"),
    supabase
      .from("media_assets")
      .select("id,title,file_name,storage_path,media_type")
      .eq("media_type", "image")
      .order("created_at", { ascending: false }),
  ]);

  if (vendorError || categoryError || fieldError || templateError || variantError || templateColorsError || storeError || assetsError) {
    throw new Error("Unable to load product onboarding.");
  }

  const optionsByTemplate = new Map<string, { sizes: string[]; colors: { name: string; imageUrl: string }[] }>();
  for (const template of templates ?? []) optionsByTemplate.set(template.id, { sizes: [], colors: [] });

  for (const variant of variants ?? []) {
    const option = optionsByTemplate.get(variant.product_template_id);
    if (!option) continue;
    if (variant.size && !option.sizes.includes(variant.size)) option.sizes.push(variant.size);
  }

  for (const color of templateColors ?? []) {
    const option = optionsByTemplate.get(color.product_template_id);
    if (!option) continue;
    option.colors.push({ name: color.color_name, imageUrl: color.image_url ?? "" });
  }

  const mediaUrls = (assets ?? []).map((asset) => ({
    id: asset.id,
    label: asset.title || asset.file_name,
    url: supabase.storage.from("media-library").getPublicUrl(asset.storage_path).data.publicUrl,
  }));

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Standard ecommerce workflow</p>
        <h1 className="mt-1 text-3xl font-black">Product onboarding</h1>
        <p className="mt-2 max-w-4xl text-sm text-black/55">
          Add products the way a modern online shop does: Product → Media → Options → Inventory → Pricing → Store. Vendor part numbers remember reusable product data, sizes, colors, and color photos.
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
        fields={fields ?? []}
        templates={(templates ?? []).map((template) => ({
          ...template,
          gallery_urls: template.gallery_urls ?? [],
          options: optionsByTemplate.get(template.id) ?? { sizes: [], colors: [] },
        }))}
        stores={(stores ?? []).map((store) => {
          const org = Array.isArray(store.organizations) ? store.organizations[0] : store.organizations;
          return { id: store.id, name: store.name, organizationName: org?.name ?? "Unknown organization" };
        })}
        mediaUrls={mediaUrls}
      />
    </div>
  );
}
