import { AppShell } from "@/components/app-shell";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/organizations", label: "Organizations" },
  { href: "/admin/stores", label: "Stores" },
  { href: "/admin/store-design", label: "Store Design" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();

  return (
    <AppShell
      title="Creative Ape Admin"
      eyebrow="Merch Network"
      nav={nav}
    >
      {children}
    </AppShell>
  );
}
