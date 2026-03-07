import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutSwitcher from "@/lib/LayoutSwitcher";
import { AdminAuthProvider } from "@/lib/admin-auth-context";
import LocalServiceWorkerCleanup from "@/components/system/LocalServiceWorkerCleanup";
import ToastProvider from "@/components/system/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Devikrupa Admin",
  description: "Admin dashboard for Devikrupa Electricals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <LocalServiceWorkerCleanup />
        <ToastProvider />
        <AdminAuthProvider>
          <LayoutSwitcher>
            {children}
          </LayoutSwitcher>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
