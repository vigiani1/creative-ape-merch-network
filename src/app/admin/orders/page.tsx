import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";

function money(cents: number) {
  return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(cents/100);
}

type OrdersPayload = {
  count?: number;
  orders?: Array<{
    id:string;
    orderNumber:string;
    organizationName?:string|null;
    storeName?:string|null;
    customerName?:string|null;
    customerEmail?:string|null;
    paymentStatus:string;
    fulfillmentStatus:string;
    currency:string;
    grandTotalCents:number;
    createdAt:string;
  }>;
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const query=await searchParams;
  const { supabase }=await requireSuperAdmin();
  const payment=typeof query.payment==="string"?query.payment:undefined;
  const fulfillment=typeof query.fulfillment==="string"?query.fulfillment:undefined;
  const search=typeof query.q==="string"?query.q:undefined;

  const { data,error }=await supabase.rpc("get_admin_orders_v1",{
    target_organization_id:undefined,
    target_store_id:undefined,
    payment_status_filter:payment,
    fulfillment_status_filter:fulfillment,
    search_query:search,
    result_limit:200,
    result_offset:0,
  });

  if(error) throw new Error("Unable to load orders.");

  const payload=(data ?? {}) as OrdersPayload;
  const orders=payload.orders ?? [];

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Commerce</p>
          <h2>Orders</h2>
          <p>{payload.count ?? orders.length} orders across the network.</p>
        </div>
      </section>

      <section className="admin-product-toolbar">
        <form className="admin-search" action="/admin/orders">
          <input name="q" type="search" defaultValue={search} placeholder="Order number, customer, email" />
          <button type="submit">Search</button>
        </form>
        <div className="admin-filter-row">
          <a href="/admin/orders" className={!payment&&!fulfillment?"is-active":""}>All</a>
          <a href="/admin/orders?payment=paid" className={payment==="paid"?"is-active":""}>Paid</a>
          <a href="/admin/orders?fulfillment=paid" className={fulfillment==="paid"?"is-active":""}>To fulfill</a>
          <a href="/admin/orders?fulfillment=fulfilled" className={fulfillment==="fulfilled"?"is-active":""}>Fulfilled</a>
        </div>
      </section>

      <section className="admin-table-wrap">
        <table className="admin-table admin-orders-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Organization / Store</th><th>Payment</th><th>Fulfillment</th><th>Total</th><th>Created</th></tr></thead>
          <tbody>
            {orders.map((order)=>(
              <tr key={order.id}>
                <td><Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></td>
                <td><strong>{order.customerName || "Guest"}</strong><small>{order.customerEmail || "No email"}</small></td>
                <td><strong>{order.organizationName || "Unknown"}</strong><small>{order.storeName || "Unknown store"}</small></td>
                <td><span className={`admin-status admin-status--${order.paymentStatus}`}>{order.paymentStatus}</span></td>
                <td><span className={`admin-status admin-status--${order.fulfillmentStatus}`}>{order.fulfillmentStatus}</span></td>
                <td>{money(order.grandTotalCents)}</td>
                <td>{new Date(order.createdAt).toLocaleDateString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {!orders.length?<div className="admin-empty admin-empty--large"><h3>No orders found.</h3><p>Try another filter or search.</p></div>:null}
    </div>
  );
}
