import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CommishCrunch - No-BS Commission Calculators",
  description: "Simple, fast commission calculators for solar sales, lighting, and pest control. No accounts required.",
  icons: {
    icon: [
      {
        url: '/calculator.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/calculator.png',
        type: 'image/png',
      }
    ],
    shortcut: '/calculator.png',
    apple: '/calculator.png',
  },
};

import Navbar from "@/components/navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
          <Navbar />
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
