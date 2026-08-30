import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganizationMembership } from "@/lib/auth";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function variantLabel(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Base product";
  const row = value as Record<string, unknown>;
  const parts = [row.size, row.color].filter((part): part is string => typeof part === "string" && part.length > 0);
  return parts.length ? parts.join(" · ") : "Base product";
}

export default async function PortalOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, organizationIds } = await requireOrganizationMembership();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,organization_id,order_number,customer_name,payment_status,fulfillment_status,subtotal,discount_total,shipping_total,tax_total,grand_total,created_at")
    .eq("id", id)
    .in("organization_id", organizationIds)
    .maybeSingle();

  if (orderError || !order) notFound();

  const [{ data: items, error: itemError }, { data: events, error: eventError }, { data: notes, error: notesError }] = await Promise.all([
    supabase.rpc("get_member_order_items", { target_order_id: order.id }),
    supabase.rpc("get_member_fulfillment_events", { target_order_id: order.id }),
    supabase.rpc("get_member_order_notes", { target_order_id: order.id }),
  ]);

  if (itemError || eventError || notesError) throw new Error("Unable to load order details.");

  const isTest = order.order_number.startsWith("TEST-");

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <Link href="/portal/orders" className="text-sm font-semibold underline">Back to orders</Link>
        <div className="mt-4 flex items-center gap-3">
          <h1 className="text-3xl font-black">{order.order_number}</h1>
          {isTest ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-900">Test</span> : null}
        </div>
        <p className="mt-2 text-sm text-black/55">{order.customer_name || "Guest customer"} · {new Date(order.created_at).toLocaleString("en-US")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-black/45">Order total</p><p className="mt-2 text-2xl font-black">{money(order.grand_total)}</p></div>
        <div className="rounded-2xl border border-black/10 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-black/45">Payment</p><p className="mt-2 text-xl font-black">{isTest ? "Simulated" : order.payment_status}</p></div>
        <div className="rounded-2xl border border-black/10 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-black/45">Fulfillment</p><p className="mt-2 text-xl font-black capitalize">{order.fulfillment_status}</p></div>
      </div>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm font-semibold text-black/45">Order items</p>
        <div className="mt-5 grid gap-4">
          {(items ?? []).map((item) => (
            <div key={item.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-black/10 p-5">
              <div>
                <h2 className="font-black">{item.name_snapshot}</h2>
                <p className="mt-1 text-sm text-black/55">{variantLabel(item.variant_snapshot)}{item.sku_snapshot ? ` · ${item.sku_snapshot}` : ""}</p>
              </div>
              <div className="text-right">
                <p className="font-black">{item.quantity} × {money(Number(item.unit_price_snapshot))}</p>
                <p className="mt-1 text-xs text-black/45">Org share: {money(Number(item.organization_share_snapshot))}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm font-semibold text-black/45">Fulfillment history</p>
        <div className="mt-5 grid gap-4">
          {(events ?? []).map((event) => (
            <div key={event.id} className="border-l-2 border-black/15 pl-4">
              <p className="font-bold capitalize">{event.status}</p>
              <p className="text-xs text-black/45">{new Date(event.created_at).toLocaleString("en-US")}</p>
              {event.notes ? <p className="mt-1 text-sm text-black/60">{event.notes}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm font-semibold text-black/45">Organization notes</p>
        <div className="mt-5 grid gap-4">
          {(notes ?? []).map((note) => (
            <div key={note.id} className="rounded-xl border border-black/10 p-4">
              <p className="whitespace-pre-line text-sm">{note.note}</p>
              <p className="mt-2 text-xs text-black/40">{new Date(note.created_at).toLocaleString("en-US")}</p>
            </div>
          ))}
          {!notes?.length ? <p className="text-sm text-black/45">No notes shared with your organization.</p> : null}
        </div>
      </section>

      <p className="text-xs text-black/45">Creative Ape production costs, internal notes, and internal financial ledger entries are intentionally hidden from the organization portal.</p>
    </div>
  );
}
