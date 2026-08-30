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
  { href: "/admin/page-editor", label: "Page Editor" },
  { href: "/admin/store-design", label: "Store Design" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireSuperAdmin();
  const { data: stores, error } = await supabase
    .from("stores")
    .select("id,name,slug")
    .neq("status","archived")
    .order("name");

  if(error) throw new Error("Unable to load admin store context.");

  return (
    <AppShell
      title="Creative Ape Admin"
      eyebrow="Merch Network"
      nav={nav}
      stores={(stores ?? []).map((store)=>({id:store.id,name:store.name,slug:store.slug}))}
    >
      {children}
    </AppShell>
  );
}
