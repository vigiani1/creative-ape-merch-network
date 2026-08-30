import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Creative Ape Merch Network",
    template: "%s | Creative Ape Merch Network",
  },
  description: "Multi-tenant merchandise storefronts powered by Creative Ape Branding.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
