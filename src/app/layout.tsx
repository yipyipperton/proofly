import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif-display", weight: ["500", "600"] });

export const metadata: Metadata = {
  title: "Proofly: check a message before you trust it",
  description: "Paste a suspicious text, email, job offer or marketplace chat and get a calm, plain-English read on its red flags.",
  applicationName: "Proofly",
  appleWebApp: { capable: true, title: "Proofly", statusBarStyle: "default" },
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#f6f7f9" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${serif.variable} font-sans min-h-dvh overflow-x-hidden`}>{children}</body>
    </html>
  );
}
