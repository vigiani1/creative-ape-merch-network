import { requireSuperAdmin } from "@/lib/auth";
import { csvRow } from "@/lib/csv";

export async function GET() {
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

  if (orgError || ordersError || ledgerError || payoutsError) {
    return new Response("Unable to export report.", { status: 500 });
  }

  const realOrderIds = new Set(
    (orders ?? [])
      .filter((order) => !order.order_number.startsWith("TEST-"))
      .map((order) => order.id)
  );

  const lines = [
    csvRow(["Organization","Status","Paid Orders","Gross Sales","Organization Share","Paid Out","Pending Payout"]),
  ];

  for (const org of organizations ?? []) {
    const paidOrders = (orders ?? []).filter(
      (order) =>
        order.organization_id === org.id &&
        order.payment_status === "paid" &&
        !order.order_number.startsWith("TEST-")
    );

    const gross = paidOrders.reduce((sum, order) => sum + order.grand_total, 0);
    const share = (ledger ?? [])
      .filter(
        (entry) =>
          entry.organization_id === org.id &&
          entry.entry_type === "organization_share" &&
          entry.order_id &&
          realOrderIds.has(entry.order_id)
      )
      .reduce((sum, entry) => sum + entry.amount, 0);

    const paidOut = (payouts ?? [])
      .filter((payout) => payout.organization_id === org.id && payout.status === "paid")
      .reduce((sum, payout) => sum + payout.amount, 0);

    const pending = (payouts ?? [])
      .filter(
        (payout) =>
          payout.organization_id === org.id &&
          ["pending","processing"].includes(payout.status)
      )
      .reduce((sum, payout) => sum + payout.amount, 0);

    lines.push(
      csvRow([
        org.name,
        org.status,
        paidOrders.length,
        (gross / 100).toFixed(2),
        (share / 100).toFixed(2),
        (paidOut / 100).toFixed(2),
        (pending / 100).toFixed(2),
      ])
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="creative-ape-organization-report.csv"',
      "cache-control": "no-store",
    },
  });
}
