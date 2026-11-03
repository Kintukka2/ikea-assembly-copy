import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Display } from "next/font/google";
import "./globals.css";
import "./guide.css";
import "./home.css";
import "./scan.css";
import { Analytics } from "@vercel/analytics/next";
import Offline from "@/components/Offline";
import MotionPrefs from "@/components/MotionPrefs";
import { SITE_URL } from "@/lib/site";

const noto = Noto_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto",
  display: "swap",
});

const display = Noto_Sans_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const description = "Type the product name or number from the box, from IKEA or Kmart. Dowel shows every assembly step in 3D, with the parts, screws and tools for each one, and reads it out loud.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Dowel: build any flat pack, step by step",
  description,
  applicationName: "Dowel",
  appleWebApp: { capable: true, title: "Dowel", statusBarStyle: "default" },
  openGraph: { type: "website", siteName: "Dowel", title: "Dowel: build any flat pack, step by step", description, url: "/" },
  twitter: { card: "summary_large_image", title: "Dowel: build any flat pack, step by step", description },
};

export const viewport: Viewport = {
  themeColor: "#f5f4f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${noto.variable} ${display.variable}`}>
      <body>
        <MotionPrefs>{children}</MotionPrefs>
        {process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === "1" && <Analytics />}
        {/* it reads the path, which the prerendered shell doesn't know yet */}
        <Suspense fallback={null}>
          <Offline />
        </Suspense>
      </body>
    </html>
  );
}
