"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";

export type NavItem = { href: string; label: string; icon?: string };

export function AppShell({
  title,
  eyebrow,
  nav,
  children,
}: {
  title: string;
  eyebrow: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <Link href="/admin" className="admin-sidebar__wordmark">Creative Ape</Link>
          <p>{eyebrow}</p>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Admin">
          {nav.map((item) => {
            const active = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "admin-nav-link is-active" : "admin-nav-link"}
              >
                <span className="admin-nav-link__dot" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <Link href="/shop/demo" target="_blank">View storefront ↗</Link>
          <form action={signOut}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-topbar__eyebrow">Admin</p>
            <h1>{title}</h1>
          </div>
          <div className="admin-topbar__meta">
            <span>Creative Ape Merch Network</span>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
