import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pop Mart Auction Platform",
  description:
    "Secure Pop Mart collectible auctions with payment protection, authenticity checks, and tracked delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
