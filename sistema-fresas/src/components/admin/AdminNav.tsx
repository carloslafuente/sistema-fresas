"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/ventas", label: "Ventas" },
  { href: "/admin/inventario", label: "Inventario" },
  { href: "/admin/gastos", label: "Gastos" },
  { href: "/admin/cuentas-por-cobrar", label: "Cuentas por cobrar" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open]);

  return (
    <>
      <header className="border-b bg-background sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <span className="font-semibold text-sm">🍓 Fresas</span>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-2.5 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors",
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
                className="px-2.5 py-1.5 text-xs rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                Salir
              </button>
            </nav>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 -mr-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10 bg-black/20 md:hidden"
            onClick={() => setOpen(false)}
          />
          {/* Menu panel */}
          <div className="fixed top-12 left-0 right-0 z-10 bg-background border-b shadow-md md:hidden">
            <nav className="max-w-4xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-3 text-sm rounded-lg transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="px-3 py-3 text-sm rounded-lg text-left text-muted-foreground hover:bg-accent"
              >
                Salir
              </button>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
