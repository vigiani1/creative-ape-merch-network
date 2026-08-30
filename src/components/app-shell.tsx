import Link from "next/link";
import { signOut } from "@/app/login/actions";

export type NavItem = { href: string; label: string };

export function AppShell({ title, eyebrow, nav, children }: { title: string; eyebrow: string; nav: NavItem[]; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-100 md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-b border-black/10 bg-neutral-950 p-6 text-white md:min-h-screen md:border-b-0 md:border-r">
        <Link href="/" className="text-sm font-bold uppercase tracking-[0.18em]">Creative Ape</Link>
        <p className="mt-2 text-xs text-white/50">{eyebrow}</p>
        <nav className="mt-8 grid gap-1">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white">{item.label}</Link>
          ))}
        </nav>
        <form action={signOut} className="mt-8">
          <button type="submit" className="rounded-lg px-3 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white">Sign out</button>
        </form>
      </aside>
      <main className="p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
