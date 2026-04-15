import type { Metadata, Viewport } from "next";
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
    "A beautiful Islamic Faith-Tech application featuring a Quran Reader with word-for-word translation, listening mode, daily duas, and spiritual motivation.",
  keywords: [
    "Quran",
    "Islam",
    "Noor",
    "Quran Reader",
    "Daily Dua",
    "Arabic",
    "Translation",
    "Listening",
    "Offline Quran",
  ],
  authors: [{ name: "Noor App" }],
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Noor — Quran Reader & Daily Motivation",
    description:
      "A beautiful Islamic Faith-Tech application for reading the Quran with word-for-word translation, listening, and daily duas.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D4B3C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
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
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Noor" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Noor" />
        <meta name="msapplication-TileColor" content="#0D4B3C" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
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
