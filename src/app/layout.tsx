import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toast } from "@/components/Toast";
import { RegionModal } from "@/components/RegionModal";
import { CookieBanner } from "@/components/CookieBanner";
import { LiveChat } from "@/components/LiveChat";

export const metadata: Metadata = {
  title: "BGV Fashion — Luxury Contemporary Wardrobe",
  description:
    "Explore luxury contemporary women's and men's fashion. Handcrafted pieces dispatched from Ojo, Lagos to 193 countries worldwide.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
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
