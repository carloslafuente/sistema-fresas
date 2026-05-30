"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/ventas", label: "Ventas" },
  { href: "/admin/inventario", label: "Inventario" },
  { href: "/admin/gastos", label: "Gastos" },
  { href: "/admin/cuentas-por-cobrar", label: "Cuentas" },
  { href: "/admin/configuracion", label: "Config" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          <span className="font-semibold text-sm">🍓 Fresas</span>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-2 py-1 text-xs rounded-md text-muted-foreground hover:text-foreground hover:bg-accent whitespace-nowrap"
            >
              Salir
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
