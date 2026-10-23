import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif-display", weight: ["500", "600"] });

export const metadata: Metadata = {
  title: "Proofly: check a message before you trust it",
  description: "Paste a suspicious text, email, job offer or marketplace chat and get a calm, plain-English read on its red flags.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f7f9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${serif.variable} font-sans min-h-dvh`}>{children}</body>
    </html>
  );
}
