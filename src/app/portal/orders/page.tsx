import { requireOrganizationMembership } from "@/lib/auth";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function PortalOrdersPage() {
  const { supabase, organizationIds } = await requireOrganizationMembership();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id,order_number,organization_id,customer_name,payment_status,fulfillment_status,grand_total,created_at")
    .in("organization_id", organizationIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load organization orders.");

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-black/45">Your sales</p>
          <h1 className="mt-1 text-2xl font-black">Orders</h1>
        </div>
        <p className="text-sm text-black/50">{orders?.length ?? 0} total</p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-black/10 text-black/45">
            <tr>
              <th className="py-3 pr-4 font-semibold">Order</th>
              <th className="py-3 pr-4 font-semibold">Customer</th>
              <th className="py-3 pr-4 font-semibold">Payment</th>
              <th className="py-3 pr-4 font-semibold">Fulfillment</th>
              <th className="py-3 pr-4 font-semibold">Total</th>
              <th className="py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => (
              <tr key={order.id} className="border-b border-black/5 last:border-0">
                <td className="py-4 pr-4 font-bold">{order.order_number}</td>
                <td className="py-4 pr-4">{order.customer_name || "Guest"}</td>
                <td className="py-4 pr-4"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{order.payment_status}</span></td>
                <td className="py-4 pr-4"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{order.fulfillment_status}</span></td>
                <td className="py-4 pr-4 font-bold">{money(order.grand_total)}</td>
                <td className="py-4 text-xs text-black/55">{new Date(order.created_at).toLocaleString("en-US")}</td>
              </tr>
            ))}
            {!orders?.length ? <tr><td colSpan={6} className="py-12 text-center text-black/45">No orders yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
