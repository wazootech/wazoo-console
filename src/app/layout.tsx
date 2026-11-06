import type { ReactNode } from "react";
import type { Metadata } from "next";

import { GTProvider } from "gt-next";
import { getLocale } from "gt-next/server";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import { AuthProvider } from "@/lib/auth";
import { ConsentProvider } from "@/lib/consent";
import { ConsentBanner } from "@/components/consent-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wazoo Console",
  description: "Wazoo platform management console",
  icons: "/favicon.svg",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html className="dark" lang={await getLocale()}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <GTProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-ring"
          >
            Skip to content
          </a>
          <AuthKitProvider>
            <AuthProvider>
              <ConsentProvider>
                {children}
                <ConsentBanner />
              </ConsentProvider>
            </AuthProvider>
          </AuthKitProvider>
        </GTProvider>
      </body>
    </html>
  );
}
