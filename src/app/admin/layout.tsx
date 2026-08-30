import { AppShell } from "@/components/app-shell";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const nav = [
  ["/admin", "Dashboard"],
  ["/admin/organizations", "Organizations"],
  ["/admin/stores", "Stores"],
  ["/admin/members", "Members"],
  ["/admin/products", "Products"],
  ["/admin/templates", "Templates"],
  ["/admin/vendors", "Vendors"],
  ["/admin/branding", "Branding"],
  ["/admin/media", "Media"],
  ["/admin/orders", "Orders"],
  ["/admin/fulfillment", "Fulfillment"],
  ["/admin/reports", "Reports"],
  ["/admin/settings", "Settings"],
].map(([href, label]) => ({ href, label }));

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();
  return <AppShell title="Creative Ape Admin" eyebrow="Merch Network Control Center" nav={nav}>{children}</AppShell>;
}
