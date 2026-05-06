"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "../lib/role-context";
import { useAuth } from "../lib/auth-context";
import logo from "../asset/logo.jpeg";

const NAV = [
  { href: "/", label: "Dashboard", icon: "ri-layout-grid-line", admin: false },
  { href: "/transactions", label: "Transactions", icon: "ri-exchange-line", admin: false },
  { href: "/inventory", label: "Inventory", icon: "ri-archive-line", admin: false },
  { href: "/invoices", label: "Invoices", icon: "ri-file-paper-2-line", admin: false },
  { href: "/quotations", label: "Quotations", icon: "ri-price-tag-3-line", admin: false },
  { href: "/contacts", label: "Contacts", icon: "ri-contacts-book-line", admin: false },
  { href: "/cash-flow", label: "Cash Flow", icon: "ri-water-flash-line", admin: true },
  { href: "/reports", label: "Reports", icon: "ri-stack-line", admin: true },
  { href: "/ai-insights", label: "AI Insights", icon: "ri-sparkling-2-line", admin: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useRole();
  const { logout } = useAuth();
  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col px-4 py-6 border-r border-line bg-white h-screen sticky top-0">
      <div className="px-2 mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden border border-line"
          >
            <img src={logo.src} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-display text-[17px] leading-tight text-ink">
              NIPANA
            </div>
            <div className="text-[10px] tracking-[0.18em] uppercase text-ink-muted">
              Atlas · GBMS
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {NAV.map((item) => {
          if (item.admin && !isAdmin) return null;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`}>
              <i className={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4">
        <div className="divider-rule mb-4" />
        <Link href="/profile" className={`nav-item ${pathname?.startsWith("/profile") ? "active" : ""}`}>
          <i className="ri-user-3-line" />
          <span>Profile</span>
        </Link>
        {isAdmin && (
          <Link href="/settings" className={`nav-item ${pathname?.startsWith("/settings") ? "active" : ""}`}>
            <i className="ri-settings-3-line" />
            <span>Settings</span>
          </Link>
        )}
        <button onClick={logout} className="nav-item w-full text-left">
          <i className="ri-logout-circle-r-line" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
