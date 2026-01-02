// Admin sidebar navigation component
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getSupabaseClient } from "@/lib/supabaseClient";

const AdminSidebar = React.memo(() => {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const getUserEmail = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getUserEmail();
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const navItems = [
    { href: "/admin", labelKey: "admin.dashboard", icon: "📊" },
    { href: "/admin/users", labelKey: "admin.users", icon: "👥" },
    { href: "/admin/shops", labelKey: "admin.shops", icon: "🏪" },
    { href: "/admin/shop-claims", labelKey: "admin.claims", icon: "📋" },
  ];

  const MobileDrawer = (
    <div
      className={`lg:hidden fixed inset-0 z-[250] bg-slate-900 text-white transition-transform duration-300 ${
        drawerOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ maxWidth: 320 }}
      onClick={() => setDrawerOpen(false)}
    >
      <nav
        className="p-4 h-full flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ height: "100vh", width: "100%" }}
      >
        <button
          aria-label="Close menu"
          className="text-2xl text-gray-400 self-end mb-4"
          onClick={() => setDrawerOpen(false)}
        >
          ×
        </button>
        <ul className="space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white font-bold"
                      : "text-gray-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  onClick={() => setDrawerOpen(false)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto pt-4 border-t border-slate-700">
          <div className="px-4 py-2 text-sm text-gray-400 mb-2">
            {userEmail}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>🚪</span>
            <span>{t("nav.logout")}</span>
          </button>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-[251] bg-blue-600 text-white p-2 rounded-lg"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Mobile drawer */}
      {MobileDrawer}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white min-h-screen">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">{t("admin.dashboard")}</h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white font-bold"
                        : "text-gray-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="px-4 py-2 text-sm text-gray-400 mb-2 truncate">
            {userEmail}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>🚪</span>
            <span>{t("nav.logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );
});

AdminSidebar.displayName = "AdminSidebar";

export default AdminSidebar;

