import { requireSuperAdmin } from "@/lib/auth";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function ReportsPage() {
  const { supabase } = await requireSuperAdmin();

  const [
    { data: organizations, error: orgError },
    { data: orders, error: ordersError },
    { data: ledger, error: ledgerError },
    { data: payouts, error: payoutsError },
  ] = await Promise.all([
    supabase.from("organizations").select("id,name,status").order("name"),
    supabase.from("orders").select("id,organization_id,grand_total,payment_status,order_number"),
    supabase.from("ledger_entries").select("organization_id,entry_type,amount,order_id"),
    supabase.from("payouts").select("organization_id,amount,status"),
  ]);

  if (orgError || ordersError || ledgerError || payoutsError) throw new Error("Unable to build report.");

  const realOrderIds = new Set((orders ?? []).filter((order) => !order.order_number.startsWith("TEST-")).map((order) => order.id));

  const rows = (organizations ?? []).map((org) => {
    const paidOrders = (orders ?? []).filter(
      (order) =>
        order.organization_id === org.id &&
        order.payment_status === "paid" &&
        !order.order_number.startsWith("TEST-")
    );
    const gross = paidOrders.reduce((sum, order) => sum + order.grand_total, 0);
    const share = (ledger ?? [])
      .filter((entry) => entry.organization_id === org.id && entry.entry_type === "organization_share" && entry.order_id && realOrderIds.has(entry.order_id))
      .reduce((sum, entry) => sum + entry.amount, 0);
    const paidOut = (payouts ?? []).filter((payout) => payout.organization_id === org.id && payout.status === "paid").reduce((sum, payout) => sum + payout.amount, 0);
    const pending = (payouts ?? []).filter((payout) => payout.organization_id === org.id && ["pending", "processing"].includes(payout.status)).reduce((sum, payout) => sum + payout.amount, 0);
    return { ...org, orderCount: paidOrders.length, gross, share, paidOut, pending };
  });

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div>
        <p className="text-sm font-semibold text-black/45">Finance</p>
        <h1 className="mt-1 text-2xl font-black">Organization reports</h1>
        <p className="mt-2 text-sm text-black/55">Live tenant-level financial reporting. Test checkout orders are intentionally excluded from revenue and organization-share totals.</p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-black/10 text-black/45">
            <tr>
              <th className="py-3 pr-4 font-semibold">Organization</th>
              <th className="py-3 pr-4 font-semibold">Paid orders</th>
              <th className="py-3 pr-4 font-semibold">Gross sales</th>
              <th className="py-3 pr-4 font-semibold">Org share earned</th>
              <th className="py-3 pr-4 font-semibold">Paid out</th>
              <th className="py-3 font-semibold">Pending payout</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-black/5 last:border-0">
                <td className="py-4 pr-4 font-bold">{row.name}</td>
                <td className="py-4 pr-4">{row.orderCount}</td>
                <td className="py-4 pr-4">{money(row.gross)}</td>
                <td className="py-4 pr-4">{money(row.share)}</td>
                <td className="py-4 pr-4">{money(row.paidOut)}</td>
                <td className="py-4 font-bold">{money(row.pending)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
