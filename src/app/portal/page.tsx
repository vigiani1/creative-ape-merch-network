import { DashboardCard } from "@/components/dashboard-card";
import { requireOrganizationMembership } from "@/lib/auth";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function PortalPage() {
  const { supabase, organizationIds } = await requireOrganizationMembership();

  const summaries = await Promise.all(
    organizationIds.map(async (organizationId) => {
      const { data, error } = await supabase.rpc("organization_sales_summary", { org_id: organizationId });
      if (error) throw new Error("Unable to load organization dashboard.");
      return data?.[0] ?? { gross_sales: 0, order_count: 0, organization_share: 0, outstanding_payouts: 0 };
    })
  );

  const totals = summaries.reduce(
    (acc, summary) => ({
      grossSales: acc.grossSales + Number(summary.gross_sales),
      orderCount: acc.orderCount + Number(summary.order_count),
      organizationShare: acc.organizationShare + Number(summary.organization_share),
      outstandingPayouts: acc.outstandingPayouts + Number(summary.outstanding_payouts),
    }),
    { grossSales: 0, orderCount: 0, organizationShare: 0, outstandingPayouts: 0 }
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <DashboardCard label="Paid orders" value={String(totals.orderCount)} detail="Paid and partially refunded orders for your organization." />
      <DashboardCard label="Sales" value={money(totals.grossSales)} detail="Gross paid sales for your organization." />
      <DashboardCard label="Revenue share" value={money(totals.organizationShare)} detail="Earned organization share without exposing Creative Ape internal costs." />
      <DashboardCard label="Outstanding payout" value={money(totals.outstandingPayouts)} detail="Pending or processing payout balance." />
    </div>
  );
}
