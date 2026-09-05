import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "AASP — AI Academic Success Platform",
    template: "%s — AASP",
  },
  description:
    "Research, citation, and integrity support for students without access to a library or writing tutor — in English and Bahasa Malaysia.",
  openGraph: {
    title: "AASP — AI Academic Success Platform",
    description:
      "Research, citation, and integrity support for students without access to a library or writing tutor.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col font-sans">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
