import Link from "next/link";
import { NewProductForm } from "@/components/admin/new-product-form";
import { requireSuperAdmin } from "@/lib/auth";

type Setup = {
  organizations?: Array<{ id: string; name: string }>;
  stores?: Array<{ id: string; name: string; organizationId: string }>;
  categories?: Array<{ id: string; name: string }>;
  collections?: Array<{ id: string; name: string; organizationId: string }>;
  standardSizes?: string[];
};

export default async function AddProductPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const query = await searchParams;
  const selectedStoreId = typeof query.store === "string" ? query.store : undefined;
  const { supabase } = await requireSuperAdmin();
  const { data, error } = await supabase.rpc("get_admin_merchandising_setup_v2", {
    target_organization_id: undefined,
  });

  if (error) throw new Error("Unable to load product setup.");

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Products</p>
          <h2>Add Product</h2>
          <p>One familiar merchandising flow from product basics through publishing.</p>
        </div>
        <Link href={selectedStoreId ? `/admin/products?store=${selectedStoreId}` : "/admin/products"} className="admin-secondary-action">Back to Products</Link>
      </section>

      <NewProductForm setup={(data ?? {}) as Setup} selectedStoreId={selectedStoreId} />
    </div>
  );
}
