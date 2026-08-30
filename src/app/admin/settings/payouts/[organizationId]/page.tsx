import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";

type RevealedPayload = {
  organizationId:string;
  method:string;
  displayLabel:string;
  status:string;
  details?: Record<string,string>;
};

function labelFor(key:string) {
  return key
    .replace(/([A-Z])/g," $1")
    .replace(/^./,(value)=>value.toUpperCase());
}

export default async function SecurePayoutRevealPage({
  params,
}: {
  params: Promise<{ organizationId:string }>;
}) {
  const { organizationId } = await params;
  const { supabase } = await requireSuperAdmin();

  const [{ data: revealed, error }, { data: organization }] = await Promise.all([
    supabase.rpc("reveal_organization_payout_details_v1", {
      target_organization_id: organizationId,
    }),
    supabase.from("organizations").select("name").eq("id",organizationId).maybeSingle(),
  ]);

  if (error || !revealed) notFound();

  const payout=revealed as RevealedPayload;

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Secure Reveal</p>
          <h2>{organization?.name || "Organization"} Payout Details</h2>
          <p>Visible only to Creative Ape Super Admin. Close this page when you are finished processing the payout.</p>
        </div>
        <Link href="/admin/settings" className="admin-secondary-action">Back to Admin Settings</Link>
      </section>

      <div className="admin-sensitive-warning">
        <strong>Sensitive financial information</strong>
        <p>Do not copy these details into notes, email, chat, or other unencrypted systems.</p>
      </div>

      <section className="admin-sensitive-card">
        <div className="admin-sensitive-card__head">
          <div>
            <p className="admin-kicker">{payout.method}</p>
            <h3>{payout.displayLabel}</h3>
          </div>
          <span className={`admin-status admin-status--${payout.status}`}>{payout.status}</span>
        </div>

        <dl>
          {Object.entries(payout.details ?? {}).map(([key,value])=>(
            <div key={key}>
              <dt>{labelFor(key)}</dt>
              <dd>{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
