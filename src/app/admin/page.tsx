import { DashboardCard } from "@/components/dashboard-card";
import { requireSuperAdmin } from "@/lib/auth";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function AdminPage() {
  const { supabase } = await requireSuperAdmin();

  const [
    orgsResult,
    openOrdersResult,
    ordersResult,
    orgShareResult,
  ] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .not("fulfillment_status", "in", '("complete","cancelled","refunded")'),
    supabase
      .from("orders")
      .select("grand_total")
      .eq("payment_status", "paid")
      .not("order_number", "like", "TEST-%"),
    supabase
      .from("ledger_entries")
      .select("amount,orders!inner(order_number)")
      .eq("entry_type", "organization_share")
      .not("orders.order_number", "like", "TEST-%"),
  ]);

  const grossSales = (ordersResult.data ?? []).reduce((sum, row) => sum + row.grand_total, 0);
  const orgShareOwed = (orgShareResult.data ?? []).reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <DashboardCard label="Organizations" value={String(orgsResult.count ?? 0)} detail="Active tenant records in Supabase." />
      <DashboardCard label="Open orders" value={String(openOrdersResult.count ?? 0)} detail="Includes test workflow orders until they are completed." />
      <DashboardCard label="Gross sales" value={money(grossSales)} detail="Real paid order totals. Test orders are excluded." />
      <DashboardCard label="Org share owed" value={money(orgShareOwed)} detail="Real organization-share balance before payouts. Test orders are excluded." />
    </div>
  );
}
