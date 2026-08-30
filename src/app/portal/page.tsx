import { DashboardCard } from "@/components/dashboard-card";
import { requireOrganizationMembership } from "@/lib/auth";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function PortalPage() {
  const { supabase, organizationIds } = await requireOrganizationMembership();

  const [ordersResult, shareResult, payoutsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("grand_total")
      .in("organization_id", organizationIds)
      .eq("payment_status", "paid"),
    supabase
      .from("ledger_entries")
      .select("amount")
      .in("organization_id", organizationIds)
      .eq("entry_type", "organization_share"),
    supabase
      .from("payouts")
      .select("amount")
      .in("organization_id", organizationIds)
      .in("status", ["pending", "processing"]),
  ]);

  const sales = (ordersResult.data ?? []).reduce((sum, row) => sum + row.grand_total, 0);
  const revenueShare = (shareResult.data ?? []).reduce((sum, row) => sum + row.amount, 0);
  const outstandingPayout = (payoutsResult.data ?? []).reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <DashboardCard label="Sales" value={money(sales)} detail="Paid sales for your organization." />
      <DashboardCard label="Revenue share" value={money(revenueShare)} detail="Earned organization share without exposing Creative Ape internal costs." />
      <DashboardCard label="Outstanding payout" value={money(outstandingPayout)} detail="Pending or processing payout balance." />
    </div>
  );
}
