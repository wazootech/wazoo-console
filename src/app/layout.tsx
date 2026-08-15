import type { ReactNode } from "react";
import type { Metadata } from "next";
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthKitProvider>
          <AuthProvider>
            <ConsentProvider>
              {children}
              <ConsentBanner />
            </ConsentProvider>
          </AuthProvider>
        </AuthKitProvider>
      </body>
    </html>
  );
}
