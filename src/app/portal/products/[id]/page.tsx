import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductOptionEditor } from "@/components/admin/product-option-editor";
import { requireOrganizationMembership } from "@/lib/auth";

type EditorRow = {
  product_id: string;
  organization_id: string;
  product_name: string;
  product_slug: string;
  store_slug: string;
  inventory_quantity: number | null;
  sizes: unknown;
  colors: unknown;
};

type ColorRow = {
  id?: string;
  name: string;
  imageUrl: string;
  displayOrder?: number;
};

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function colorArray(value: unknown): ColorRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = item as Record<string, unknown>;
    if (typeof row.name !== "string") return [];
    return [{
      id: typeof row.id === "string" ? row.id : undefined,
      name: row.name,
      imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : "",
      displayOrder: typeof row.displayOrder === "number" ? row.displayOrder : undefined,
    }];
  });
}

export default async function PortalProductOptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireOrganizationMembership();

  const { data: rows, error } = await supabase.rpc("get_org_admin_product_option_editor", {
    target_product_id: id,
  });
  const product = rows?.[0] as EditorRow | undefined;
  if (error || !product) notFound();

  const { data: assets, error: assetsError } = await supabase
    .from("media_assets")
    .select("id,title,file_name,storage_path,media_type")
    .eq("organization_id", product.organization_id)
    .eq("media_type", "image")
    .order("created_at", { ascending: false });

  if (assetsError) throw new Error("Unable to load organization media.");

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
        <h1 className="mt-1 text-3xl font-black">{product.product_name}</h1>
        <p className="mt-2 max-w-3xl text-sm text-black/55">Manage the customer-facing sizes and colors plus the private inventory count for this product.</p>
      </div>

      <ProductOptionEditor
        productId={product.product_id}
        initialSizes={stringArray(product.sizes)}
        initialColors={colorArray(product.colors)}
        initialQuantity={product.inventory_quantity}
        mediaUrls={mediaUrls}
      />
    </div>
  );
}
