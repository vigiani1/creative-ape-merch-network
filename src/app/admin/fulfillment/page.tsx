import { updateFulfillment } from "./actions";
import { requireSuperAdmin } from "@/lib/auth";

const statuses = ["paid", "processing", "production", "ready", "shipped", "complete", "cancelled", "refunded"] as const;

export default async function FulfillmentPage() {
  const { supabase } = await requireSuperAdmin();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id,order_number,customer_name,customer_email,fulfillment_status,payment_status,created_at")
    .not("fulfillment_status", "in", '("complete","cancelled","refunded")')
    .order("created_at", { ascending: true });

  if (error) throw new Error("Unable to load fulfillment queue.");

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-black/45">Production pipeline</p>
        <h1 className="mt-1 text-2xl font-black">Fulfillment</h1>
        <p className="mt-2 text-sm text-black/55">Move orders through Paid → Processing → Production → Ready → Shipped → Complete. Every change is written to fulfillment history.</p>
      </div>

      {(orders ?? []).map((order) => (
        <form key={order.id} action={updateFulfillment} className="grid gap-4 rounded-2xl border border-black/10 bg-white p-5 lg:grid-cols-[1fr_220px_1fr_auto] lg:items-end">
          <input type="hidden" name="orderId" value={order.id} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/45">{order.order_number}</p>
            <p className="mt-1 font-bold">{order.customer_name || "Guest customer"}</p>
            <p className="mt-1 text-xs text-black/45">{order.customer_email || "No email"} · payment: {order.payment_status}</p>
          </div>

          <label className="grid gap-2 text-sm font-semibold">
            Status
            <select name="status" defaultValue={order.fulfillment_status} className="rounded-xl border border-black/15 px-3 py-3 font-normal">
              {statuses.map((status) => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Note
            <input name="notes" maxLength={500} className="rounded-xl border border-black/15 px-3 py-3 font-normal" placeholder="Optional production note" />
          </label>

          <button type="submit" className="rounded-xl bg-black px-5 py-3 font-bold text-white">Update</button>
        </form>
      ))}

      {!orders?.length ? <div className="rounded-2xl border border-black/10 bg-white p-10 text-center text-sm text-black/45">Fulfillment queue is empty.</div> : null}
    </div>
  );
}
