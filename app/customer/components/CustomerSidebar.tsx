"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCustomAuth } from "@/lib/useCustomAuth";
import { useCustomerNotifications } from "./CustomerNotificationContext";
import NotificationDot from "@/app/components/NotificationDot";
import { useState } from "react";

export default function CustomerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const { signOut } = useCustomAuth();
  const { unreadBookingsCount, unreadMessagesCount } = useCustomerNotifications();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const isActive = (path: string) => {
    if (path === "/customer/home") {
      return pathname === "/customer/home" || pathname === "/customer";
    }
    return pathname?.startsWith(path);
  };

        const navItems = [
          { href: "/customer/home", labelKey: "customer.nav.home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
          { href: "/customer/bookings", labelKey: "customer.nav.myBookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          { href: "/customer/messages", labelKey: "customer.nav.messages", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
          { href: "/customer/support", labelKey: "customer.nav.support", icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" },
          { href: "/customer/favorites", labelKey: "customer.nav.favorites", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
          { href: "/customer/shops", labelKey: "customer.nav.browseShops", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
          { href: "/customer/settings", labelKey: "customer.nav.settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
        ];

  const MobileDrawer = (
    <div
      className={`lg:hidden fixed inset-0 z-[250] bg-white border-r border-gray-200 transition-transform duration-300 ${
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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Customer Dashboard</h1>
          <button
            aria-label="Close menu"
            className="text-2xl text-gray-400"
            onClick={() => setDrawerOpen(false)}
          >
            ×
          </button>
        </div>
        <ul className="space-y-1 flex-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setDrawerOpen(false)}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={item.icon}
                  />
                </svg>
                <span>{t(item.labelKey)}</span>
                {item.href === "/customer/bookings" && unreadBookingsCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {unreadBookingsCount}
                  </span>
                )}
                {item.href === "/customer/messages" && unreadMessagesCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {unreadMessagesCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-red-600 hover:bg-red-50 font-medium"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>{t('nav.logout') || 'Logout'}</span>
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
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
        <div className="h-full pt-16 pb-4 overflow-y-auto">
          <nav className="px-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={item.icon}
                  />
                </svg>
                <span>{t(item.labelKey)}</span>
                {item.href === "/customer/bookings" && unreadBookingsCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {unreadBookingsCount}
                  </span>
                )}
                {item.href === "/customer/messages" && unreadMessagesCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {unreadMessagesCount}
                  </span>
                )}
              </Link>
            ))}

            {/* Logout Button - Separated at the bottom */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-red-600 hover:bg-red-50 font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>{t('nav.logout') || 'Logout'}</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}

