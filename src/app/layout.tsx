import type { Metadata } from "next";
import { Bebas_Neue, Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/shared/providers/app-providers";
import { AppShell } from "@/shared/layout/app-shell";

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Movies To Watch",
  description: "Search movies, explore details, and manage your watchlist.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${bebasNeue.variable} ${notoSansTC.variable} h-full`}
    >
      <body className="min-h-full">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
