import Link from "next/link";
import { notFound } from "next/navigation";
import { addOrderNote, updateOrderCustomer } from "./actions";
import { requireSuperAdmin } from "@/lib/auth";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function variantLabel(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Base product";
  const row = value as Record<string, unknown>;
  const parts = [row.size, row.color].filter((part): part is string => typeof part === "string" && part.length > 0);
  return parts.length ? parts.join(" · ") : "Base product";
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireSuperAdmin();

  const [
    { data: order, error: orderError },
    { data: items, error: itemError },
    { data: events, error: eventError },
    { data: ledger, error: ledgerError },
    { data: notes, error: notesError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id,organization_id,store_id,order_number,customer_name,customer_email,payment_status,fulfillment_status,currency,subtotal,discount_total,shipping_total,tax_total,grand_total,shipping_address,created_at,updated_at,organizations(name),stores(name,slug)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select("id,name_snapshot,sku_snapshot,variant_snapshot,quantity,unit_price_snapshot,production_cost_snapshot,discount_snapshot,processing_fee_snapshot,shipping_allocation_snapshot,organization_share_snapshot,creative_ape_share_snapshot,revenue_share_rule_snapshot")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("fulfillment_events")
      .select("id,status,notes,created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("ledger_entries")
      .select("id,entry_type,amount,memo,created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("order_notes")
      .select("id,visibility,note,created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (orderError || !order) notFound();
  if (itemError || eventError || ledgerError || notesError) throw new Error("Unable to load order details.");

  const organization = Array.isArray(order.organizations) ? order.organizations[0] : order.organizations;
  const store = Array.isArray(order.stores) ? order.stores[0] : order.stores;
  const isTest = order.order_number.startsWith("TEST-");
  const totalProductionCost = (items ?? []).reduce((sum, item) => sum + item.production_cost_snapshot * item.quantity, 0);
  const totalOrgShare = (items ?? []).reduce((sum, item) => sum + item.organization_share_snapshot, 0);
  const totalCreativeShare = (items ?? []).reduce((sum, item) => sum + item.creative_ape_share_snapshot, 0);
  const address = order.shipping_address && typeof order.shipping_address === "object" && !Array.isArray(order.shipping_address)
    ? order.shipping_address as Record<string, unknown>
    : {};

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="text-sm font-semibold underline">Back to orders</Link>
          <div className="mt-4 flex items-center gap-3">
            <h1 className="text-3xl font-black">{order.order_number}</h1>
            {isTest ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-900">Test order</span> : null}
          </div>
          <p className="mt-2 text-sm text-black/55">{organization?.name ?? "Unknown organization"} · {store?.name ?? "Unknown store"}</p>
        </div>
        {store?.slug ? <Link href={`/shop/${store.slug}`} target="_blank" className="rounded-xl border border-black/15 px-4 py-2.5 text-sm font-bold">Open storefront</Link> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-black/10 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-black/45">Order total</p><p className="mt-2 text-2xl font-black">{money(order.grand_total)}</p></div>
        <div className="rounded-2xl border border-black/10 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-black/45">Production cost</p><p className="mt-2 text-2xl font-black">{money(totalProductionCost)}</p></div>
        <div className="rounded-2xl border border-black/10 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-black/45">Organization share</p><p className="mt-2 text-2xl font-black">{money(totalOrgShare)}</p></div>
        <div className="rounded-2xl border border-black/10 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-black/45">Creative Ape share</p><p className="mt-2 text-2xl font-black">{money(totalCreativeShare)}</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <section className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-sm font-semibold text-black/45">Snapshot</p><h2 className="mt-1 text-2xl font-black">Items</h2></div>
            <p className="text-sm text-black/50">{items?.length ?? 0} lines</p>
          </div>

          <div className="mt-6 grid gap-4">
            {(items ?? []).map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/10 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-black">{item.name_snapshot}</h3>
                    <p className="mt-1 text-sm text-black/55">{variantLabel(item.variant_snapshot)}{item.sku_snapshot ? ` · ${item.sku_snapshot}` : ""}</p>
                  </div>
                  <p className="font-black">{item.quantity} × {money(item.unit_price_snapshot)}</p>
                </div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div><span className="text-black/45">Unit cost</span><p className="font-bold">{money(item.production_cost_snapshot)}</p></div>
                  <div><span className="text-black/45">Org share</span><p className="font-bold">{money(item.organization_share_snapshot)}</p></div>
                  <div><span className="text-black/45">Creative Ape</span><p className="font-bold">{money(item.creative_ape_share_snapshot)}</p></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6">
          <section className="rounded-2xl border border-black/10 bg-white p-6">
            <p className="text-sm font-semibold text-black/45">Customer & shipping</p>
            <form action={updateOrderCustomer} className="mt-4 grid gap-3">
              <input type="hidden" name="orderId" value={order.id} />
              <label className="grid gap-1 text-xs font-semibold">Customer name
                <input name="customerName" defaultValue={order.customer_name ?? ""} required className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-1 text-xs font-semibold">Email
                <input name="customerEmail" type="email" defaultValue={order.customer_email ?? ""} required className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-1 text-xs font-semibold">Address
                <input name="line1" defaultValue={typeof address.line1 === "string" ? address.line1 : ""} required className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-1 text-xs font-semibold">Apt / Suite
                <input name="line2" defaultValue={typeof address.line2 === "string" ? address.line2 : ""} className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs font-semibold">City
                  <input name="city" defaultValue={typeof address.city === "string" ? address.city : ""} required className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-1 text-xs font-semibold">State
                  <input name="state" defaultValue={typeof address.state === "string" ? address.state : ""} required className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
                </label>
              </div>
              <div className="grid grid-cols-[1fr_90px] gap-2">
                <label className="grid gap-1 text-xs font-semibold">ZIP
                  <input name="postalCode" defaultValue={typeof address.postal_code === "string" ? address.postal_code : ""} required className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-1 text-xs font-semibold">Country
                  <input name="country" defaultValue={typeof address.country === "string" ? address.country : "US"} required maxLength={2} className="rounded-lg border border-black/15 px-3 py-2 font-normal uppercase" />
                </label>
              </div>
              <button type="submit" className="mt-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white">Save customer info</button>
            </form>
            <div className="mt-5 grid gap-2 text-sm">
              <p><span className="font-semibold">Payment:</span> {isTest ? "simulated" : order.payment_status}</p>
              <p><span className="font-semibold">Fulfillment:</span> {order.fulfillment_status}</p>
              <p><span className="font-semibold">Created:</span> {new Date(order.created_at).toLocaleString("en-US")}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-6">
            <p className="text-sm font-semibold text-black/45">Fulfillment history</p>
            <div className="mt-4 grid gap-4">
              {(events ?? []).map((event) => (
                <div key={event.id} className="border-l-2 border-black/15 pl-4">
                  <p className="font-bold capitalize">{event.status}</p>
                  <p className="text-xs text-black/45">{new Date(event.created_at).toLocaleString("en-US")}</p>
                  {event.notes ? <p className="mt-1 text-sm text-black/60">{event.notes}</p> : null}
                </div>
              ))}
              {!events?.length ? <p className="text-sm text-black/45">No fulfillment history yet.</p> : null}
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm font-semibold text-black/45">Order notes</p>
        <div className="mt-4 grid gap-3">
          {(notes ?? []).map((note) => (
            <div key={note.id} className="rounded-xl border border-black/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide">{note.visibility}</span>
                <span className="text-xs text-black/40">{new Date(note.created_at).toLocaleString("en-US")}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{note.note}</p>
            </div>
          ))}
          {!notes?.length ? <p className="text-sm text-black/45">No notes yet.</p> : null}
        </div>

        <form action={addOrderNote} className="mt-5 grid gap-3 rounded-xl bg-neutral-50 p-4">
          <input type="hidden" name="orderId" value={order.id} />
          <label className="grid gap-1 text-xs font-semibold">Visibility
            <select name="visibility" defaultValue="internal" className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal">
              <option value="internal">Internal only</option>
              <option value="organization">Visible to organization</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold">Note
            <textarea name="note" rows={4} maxLength={2000} required className="rounded-lg border border-black/15 bg-white px-3 py-2 font-normal" />
          </label>
          <button type="submit" className="w-fit rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white">Add note</button>
        </form>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm font-semibold text-black/45">Internal ledger</p>
        <h2 className="mt-1 text-xl font-black">Financial entries</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-black/10 text-black/45"><tr><th className="py-3 pr-4">Type</th><th className="py-3 pr-4">Amount</th><th className="py-3 pr-4">Memo</th><th className="py-3">Created</th></tr></thead>
            <tbody>
              {(ledger ?? []).map((entry) => (
                <tr key={entry.id} className="border-b border-black/5 last:border-0">
                  <td className="py-3 pr-4 font-semibold">{entry.entry_type}</td>
                  <td className="py-3 pr-4">{money(entry.amount)}</td>
                  <td className="py-3 pr-4 text-black/55">{entry.memo || "—"}</td>
                  <td className="py-3 text-xs text-black/45">{new Date(entry.created_at).toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
