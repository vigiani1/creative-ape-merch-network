import { AppShell } from "@/components/app-shell";

const nav = [
  ["/admin", "Dashboard"],
  ["/admin/organizations", "Organizations"],
  ["/admin/stores", "Stores"],
  ["/admin/products", "Products"],
  ["/admin/orders", "Orders"],
  ["/admin/fulfillment", "Fulfillment"],
  ["/admin/reports", "Reports"],
  ["/admin/settings", "Settings"],
].map(([href, label]) => ({ href, label }));

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell title="Creative Ape Admin" eyebrow="Merch Network Control Center" nav={nav}>{children}</AppShell>;
}
