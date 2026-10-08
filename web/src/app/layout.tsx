import type { Metadata } from "next";
import { Amiri, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const amiri = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
});

const siteUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Jalees — a buddy that teaches", template: "%s" },
  description: "Practise speaking Fus'ha with a patient buddy that only uses the Arabic you've already studied, lesson by lesson.",
  openGraph: {
    type: "website",
    siteName: "Jalees",
    title: "Jalees — the missing half of the Madinah books",
    description: "A patient Arabic conversation buddy for self-study learners: voice or text, gentle corrections, and only the Arabic you've studied.",
  },
  twitter: { card: "summary", title: "Jalees — a buddy that teaches" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${amiri.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
