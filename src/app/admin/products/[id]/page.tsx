import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductEditorForm } from "@/components/admin/product-editor-form";
import { requireSuperAdmin } from "@/lib/auth";

export default async function ProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await requireSuperAdmin();

  const [{ data: editorData, error: editorError }, { data: setupData, error: setupError }] = await Promise.all([
    supabase.rpc("get_admin_product_editor_v2", { target_product_id: id }),
    supabase.rpc("get_admin_merchandising_setup_v2", { target_organization_id: undefined }),
  ]);

  if (editorError || !editorData) notFound();
  if (setupError) throw new Error("Unable to load merchandising setup.");

  const editor = editorData as {
    product: { id:string; name:string; description?:string|null; sku?:string|null; categoryId?:string|null; priceCents:number; costCents:number; status:string; featured:boolean; organizationId:string };
    sizes?: Array<{name:string;active:boolean;displayOrder:number}>;
    colors?: Array<{name:string;active:boolean;imageUrl?:string|null;displayOrder:number}>;
    inventory?: Array<{id?:string;size?:string|null;color?:string|null;quantity?:number|null;sku?:string|null;priceOverrideCents?:number|null}>;
    media?: unknown[];
    stores?: Array<{id:string;name:string;isPrimary?:boolean}>;
    collections?: Array<{id:string;name:string}>;
  };

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Products</p>
          <h2>{editor.product.name}</h2>
          <p>Edit merchandising, customer choices, inventory, and publishing in one place.</p>
        </div>
        <div className="admin-page-actions">
          <Link href="/admin/products" className="admin-secondary-action">Back to Products</Link>
        </div>
      </section>

      {query.saved === "1" || query.created === "1" ? (
        <div className="admin-save-success" role="status">
          <strong>{query.created === "1" ? "Product created successfully." : "Product saved successfully."}</strong>
          <span>Your changes are live in the admin record.</span>
        </div>
      ) : null}

      <ProductEditorForm editor={editor} setup={(setupData ?? {}) as never} />
    </div>
  );
}
