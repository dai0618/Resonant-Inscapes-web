"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthNav from "@/components/AuthNav";

type AppShellProps = {
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/create", label: "Create" },
  { href: "/library", label: "Library" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? "";
  const immersive = pathname === "/create";

  return (
    <div className="ri-app">
      <div className="ri-container">
        <header className={immersive ? "ri-header-minimal" : "ri-header"}>
          <div className="flex items-baseline justify-between gap-4">
            <Link href="/" className="ri-brand">
              Resonant Inscapes
            </Link>
            {!immersive ? <AuthNav /> : null}
          </div>
        </header>

        <main className={immersive ? "ri-main ri-main--immersive" : "ri-main"}>{children}</main>

        {!immersive ? (
          <nav className="ri-bottom-nav" aria-label="Main">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link key={href} href={href} data-active={isActive(pathname, href) ? "true" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
