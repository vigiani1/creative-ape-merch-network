import { requireOrganizationMembership } from "@/lib/auth";
import { csvRow } from "@/lib/csv";

export async function GET() {
  const { supabase, organizationIds } = await requireOrganizationMembership();

  const { data: organizations, error: orgError } = await supabase
    .from("organizations")
    .select("id,name")
    .in("id", organizationIds)
    .order("name");

  if (orgError) return new Response("Unable to export report.", { status: 500 });

  const lines = [
    csvRow(["Organization","Paid Orders","Gross Sales","Revenue Share","Outstanding Payout"]),
  ];

  for (const org of organizations ?? []) {
    const { data, error } = await supabase.rpc("organization_sales_summary", { org_id: org.id });
    if (error) return new Response("Unable to export report.", { status: 500 });

    const summary = data?.[0] ?? {
      gross_sales: 0,
      order_count: 0,
      organization_share: 0,
      outstanding_payouts: 0,
    };

    lines.push(
      csvRow([
        org.name,
        Number(summary.order_count),
        (Number(summary.gross_sales) / 100).toFixed(2),
        (Number(summary.organization_share) / 100).toFixed(2),
        (Number(summary.outstanding_payouts) / 100).toFixed(2),
      ])
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="organization-sales-report.csv"',
      "cache-control": "no-store",
    },
  });
}
