import type { Metadata } from "next";
import "./globals.css";
import { assetPath } from "@/lib/assets";

export const metadata: Metadata = {
  title: "HydroLens — See your roof’s water potential",
  description: "Explore your rooftop’s rainwater potential, compare storage options, and make a practical water plan with HydroLens.",
  icons: {
    icon: assetPath("favicon.svg"),
    shortcut: assetPath("favicon.svg"),
  },
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
