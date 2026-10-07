import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toast } from "@/components/Toast";
import { RegionModal } from "@/components/RegionModal";
import { CookieBanner } from "@/components/CookieBanner";
import { LiveChat } from "@/components/LiveChat";
import { VisitorTracker } from "@/components/VisitorTracker";

export const metadata: Metadata = {
  title: "BGV Fashion — Luxury Contemporary Wardrobe",
  description:
    "Explore luxury contemporary women's and men's fashion. Handcrafted pieces dispatched from Ojo, Lagos to 193 countries worldwide.",
  other: {
    "google-adsense-account": "ca-pub-3500745331176052",
  },
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Script
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3500745331176052"
          crossOrigin="anonymous"
        />
        <StoreProvider>
          <VisitorTracker />
          <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Header />
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
            <Toast />
            <RegionModal />
            <CookieBanner />
            <LiveChat />
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
