import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/useAuth";
import { CustomAuthProvider } from "@/lib/useCustomAuth";
import DashboardLayout from "./components/DashboardLayout";
import { NextIntlProviderWrapper } from "./components/NextIntlProvider";
import { BookingNotificationProvider } from "./components/BookingNotificationContext";

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
  console.log("🔥 Root Layout rendered");
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextIntlProviderWrapper>
          <AuthProvider>
            <CustomAuthProvider>
              <BookingNotificationProvider>
                <ClientDashboardLayout>
                  {children}
                </ClientDashboardLayout>
              </BookingNotificationProvider>
            </CustomAuthProvider>
          </AuthProvider>
        </NextIntlProviderWrapper>
      </body>
    </html>
  );
}
