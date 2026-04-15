import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Noor — Quran Reader & Daily Motivation",
  description:
    "A beautiful Islamic Faith-Tech application featuring a Quran Reader with word-for-word translation and daily spiritual motivation.",
  keywords: [
    "Quran",
    "Islam",
    "Noor",
    "Quran Reader",
    "Daily Motivation",
    "Arabic",
    "Translation",
  ],
  authors: [{ name: "Noor App" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌙</text></svg>",
  },
  openGraph: {
    title: "Noor — Quran Reader & Daily Motivation",
    description:
      "A beautiful Islamic Faith-Tech application for reading the Quran with word-for-word translation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FBF7F0] text-[#1A1A2E] dark:bg-[#0F1A14] dark:text-[#E8E0D0]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
