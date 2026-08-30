import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type DashboardPayload = {
  metrics?: Array<{ key: string; label: string; value?: number; valueCents?: number }>;
  recentOrders?: Array<{
    id: string;
    orderNumber: string;
    customerName?: string | null;
    customerEmail?: string | null;
    grandTotalCents: number;
    paymentStatus: string;
    fulfillmentStatus: string;
    createdAt: string;
    storeName?: string | null;
  }>;
  productStatus?: { published?: number; draft?: number; archived?: number };
};

export default async function AdminPage() {
  const { supabase } = await requireSuperAdmin();
  const { data, error } = await supabase.rpc("get_admin_dashboard_v1", { target_organization_id: undefined });

  if (error) throw new Error("Unable to load dashboard.");

  const dashboard = data as DashboardPayload | null;
  const metrics = dashboard?.metrics ?? [];
  const recentOrders = dashboard?.recentOrders ?? [];

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Overview</p>
          <h2>What needs your attention.</h2>
        </div>
        <div className="admin-page-actions">
          <Link href="/admin/products/new" className="admin-primary-action">Add Product</Link>
          <Link href="/admin/orders" className="admin-secondary-action">View Orders</Link>
        </div>
      </section>

      <section className="admin-metrics">
        {metrics.map((metric) => (
          <article key={metric.key} className="admin-metric">
            <span>{metric.label}</span>
            <strong>{metric.valueCents != null ? money(metric.valueCents) : String(metric.value ?? 0)}</strong>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <p className="admin-kicker">Orders</p>
              <h3>Recent activity</h3>
            </div>
            <Link href="/admin/orders">See all</Link>
          </div>

          <div className="admin-order-list">
            {recentOrders.length ? recentOrders.map((order) => (
              <Link href={`/admin/orders/${order.id}`} key={order.id} className="admin-order-row">
                <div>
                  <strong>{order.orderNumber}</strong>
                  <span>{order.customerName || order.customerEmail || "Customer"}</span>
                </div>
                <div>
                  <span>{order.storeName || "Store"}</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <strong>{money(order.grandTotalCents)}</strong>
                  <span className={`admin-status admin-status--${order.fulfillmentStatus}`}>{order.fulfillmentStatus}</span>
                </div>
              </Link>
            )) : (
              <div className="admin-empty">No recent orders.</div>
            )}
          </div>
        </div>

        <aside className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <p className="admin-kicker">Catalog</p>
              <h3>Product status</h3>
            </div>
            <Link href="/admin/products">Manage</Link>
          </div>

          <div className="admin-status-stack">
            <div><span>Published</span><strong>{dashboard?.productStatus?.published ?? 0}</strong></div>
            <div><span>Draft</span><strong>{dashboard?.productStatus?.draft ?? 0}</strong></div>
            <div><span>Archived</span><strong>{dashboard?.productStatus?.archived ?? 0}</strong></div>
          </div>
        </aside>
      </section>
    </div>
  );
}
