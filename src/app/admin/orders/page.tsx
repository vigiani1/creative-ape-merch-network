import { requireSuperAdmin } from "@/lib/auth";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function OrdersPage() {
  const { supabase } = await requireSuperAdmin();

  const [{ data: orders, error: ordersError }, { data: organizations }, { data: stores }] = await Promise.all([
    supabase.from("orders").select("id,organization_id,store_id,order_number,customer_name,customer_email,payment_status,fulfillment_status,grand_total,created_at").order("created_at", { ascending: false }),
    supabase.from("organizations").select("id,name"),
    supabase.from("stores").select("id,name"),
  ]);

  if (ordersError) throw new Error("Unable to load orders.");

  const orgNames = new Map((organizations ?? []).map((org) => [org.id, org.name]));
  const storeNames = new Map((stores ?? []).map((store) => [store.id, store.name]));

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-black/45">Commerce</p>
          <h1 className="mt-1 text-2xl font-black">Orders</h1>
          <p className="mt-2 text-sm text-black/55">Orders beginning with TEST- are simulated checkout records. No real payment was processed for them.</p>
        </div>
        <p className="text-sm text-black/50">{orders?.length ?? 0} total</p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-black/10 text-black/45">
            <tr>
              <th className="py-3 pr-4 font-semibold">Order</th>
              <th className="py-3 pr-4 font-semibold">Customer</th>
              <th className="py-3 pr-4 font-semibold">Organization / Store</th>
              <th className="py-3 pr-4 font-semibold">Payment</th>
              <th className="py-3 pr-4 font-semibold">Fulfillment</th>
              <th className="py-3 pr-4 font-semibold">Total</th>
              <th className="py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => {
              const isTest = order.order_number.startsWith("TEST-");
              return (
                <tr key={order.id} className="border-b border-black/5 last:border-0">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{order.order_number}</span>
                      {isTest ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-900">Test</span> : null}
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <p>{order.customer_name || "Guest"}</p>
                    <p className="mt-1 text-xs text-black/45">{order.customer_email || "No email"}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <p>{orgNames.get(order.organization_id) ?? "Unknown"}</p>
                    <p className="mt-1 text-xs text-black/45">{storeNames.get(order.store_id) ?? "Unknown store"}</p>
                  </td>
                  <td className="py-4 pr-4"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{isTest ? "simulated" : order.payment_status}</span></td>
                  <td className="py-4 pr-4"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{order.fulfillment_status}</span></td>
                  <td className="py-4 pr-4 font-bold">{money(order.grand_total)}</td>
                  <td className="py-4 text-xs text-black/55">{new Date(order.created_at).toLocaleString("en-US")}</td>
                </tr>
              );
            })}
            {!orders?.length ? <tr><td colSpan={7} className="py-12 text-center text-black/45">No orders yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
