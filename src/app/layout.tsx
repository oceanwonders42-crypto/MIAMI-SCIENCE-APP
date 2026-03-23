import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CapacitorShell } from "@/components/capacitor/CapacitorShell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Miami Science Tracker",
  description:
    "Track your routine, progress, supply, orders, and rewards. For informational and self-tracking purposes only.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]`}
      >
        <CapacitorShell />
        {children}
      </body>
    </html>
  );
}
