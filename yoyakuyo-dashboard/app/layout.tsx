import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/useAuth";
import { CustomAuthProvider } from "@/lib/useCustomAuth";
import { AuthRoleProvider } from "@/lib/AuthRoleContext";
import { NextIntlProviderWrapper } from "./components/NextIntlProvider";
import { BookingNotificationProvider } from "./components/BookingNotificationContext";
import ConditionalLayout from "./components/ConditionalLayout";
import { ConditionalLanguageSwitcher } from "./components/ConditionalLanguageSwitcher";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yoyaku Yo Dashboard",
  description: "Admin dashboard for managing shops, services, staff, and bookings",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Removed console.log to reduce noise
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#fff',
              color: '#333',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
          }}
        />
        {/* Universal Language Selector - sticky, always top (hidden on LINE app routes) */}
        <ConditionalLanguageSwitcher />
        <NextIntlProviderWrapper>
          <AuthRoleProvider>
            <AuthProvider>
              <CustomAuthProvider>
                <BookingNotificationProvider>
                  <ConditionalLayout>
                    {children}
                  </ConditionalLayout>
                </BookingNotificationProvider>
              </CustomAuthProvider>
            </AuthProvider>
          </AuthRoleProvider>
        </NextIntlProviderWrapper>
      </body>
    </html>
  );
}