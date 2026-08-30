import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductOptionEditor } from "@/components/admin/product-option-editor";
import { requireOrganizationMembership } from "@/lib/auth";

export default async function PortalProductOptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, memberships, organizationIds } = await requireOrganizationMembership();

  const { data: product, error } = await supabase
    .from("products")
    .select("id,organization_id,name,inventory_quantity")
    .eq("id", id)
    .in("organization_id", organizationIds)
    .maybeSingle();

  if (error || !product) notFound();

  const membership = memberships.find((item) => item.organization_id === product.organization_id);
  if (membership?.role !== "admin") redirect("/access-denied");

  const [
    { data: variants, error: variantsError },
    { data: colors, error: colorsError },
    { data: assets, error: assetsError },
  ] = await Promise.all([
    supabase
      .from("product_variants")
      .select("size,color")
      .eq("product_id", id)
      .eq("managed_by_option_editor", true)
      .eq("show_on_card", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("product_color_options")
      .select("id,color_name,image_url,display_order")
      .eq("product_id", id)
      .eq("active", true)
      .order("display_order"),
    supabase
      .from("media_assets")
      .select("id,title,file_name,storage_path,media_type")
      .eq("organization_id", product.organization_id)
      .eq("media_type", "image")
      .order("created_at", { ascending: false }),
  ]);

  if (variantsError || colorsError || assetsError) throw new Error("Unable to load product options.");

  const initialSizes = [...new Set((variants ?? []).map((variant) => variant.size).filter((value): value is string => Boolean(value)))];
  const mediaUrls = (assets ?? []).map((asset) => ({
    id: asset.id,
    label: asset.title || asset.file_name,
    url: supabase.storage.from("media-library").getPublicUrl(asset.storage_path).data.publicUrl,
  }));

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/portal/library" className="text-sm font-semibold underline">Back to Product Library</Link>
        <p className="mt-4 text-sm font-semibold text-black/45">Organization Admin</p>
        <h1 className="mt-1 text-3xl font-black">{product.name}</h1>
        <p className="mt-2 max-w-3xl text-sm text-black/55">Manage the customer-facing sizes and colors plus the private inventory count for this product.</p>
      </div>

      <ProductOptionEditor
        productId={product.id}
        initialSizes={initialSizes}
        initialColors={(colors ?? []).map((color) => ({
          id: color.id,
          name: color.color_name,
          imageUrl: color.image_url ?? "",
        }))}
        initialQuantity={product.inventory_quantity}
        mediaUrls={mediaUrls}
      />
    </div>
  );
}
