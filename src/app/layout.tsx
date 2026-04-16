import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import StructuredData from "@/components/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wird.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Wird — Quran, Duas & Daily Practice",
    template: "%s | Wird",
  },
  description:
    "Wird — Your free daily Islamic companion for reading the Quran with Arabic text, English & Bengali translations, listening to recitations by world-renowned Qaris, daily duas, prayer times, prophet stories, and spiritual motivation. Works offline as a PWA.",
  keywords: [
    "Quran",
    "Quran Reader",
    "Quran Online",
    "Islam",
    "Wird",
    "Daily Dua",
    "Duas",
    "Arabic",
    "Quran Translation",
    "English Quran",
    "Bengali Quran",
    "Quran Audio",
    "Quran Recitation",
    "Listening Quran",
    "Offline Quran",
    "Prayer Times",
    "Namaz Time",
    "Salah Times",
    "Islamic App",
    "Prophet Stories",
    "Quran PWA",
    "Mobile Quran",
    "Alafasy",
    "Islamic Duas",
    "Morning Dua",
    "Evening Dua",
  ],
  authors: [{ name: "Wird", url: SITE_URL }],
  creator: "Wird",
  publisher: "Wird",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-US": SITE_URL,
      "ar-SA": `${SITE_URL}?lang=ar`,
      "bn-BD": `${SITE_URL}?lang=bn`,
    },
  },
  openGraph: {
    title: "Wird — Quran, Duas & Daily Practice",
    description:
      "Your free daily Islamic companion. Read the Holy Quran with Arabic text and translations, listen to beautiful recitations, browse daily duas, track prayer times, and explore prophet stories.",
    type: "website",
    url: SITE_URL,
    siteName: "Wird",
    locale: "en_US",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Wird — Quran, Duas & Daily Practice",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Wird — Quran, Duas & Daily Practice",
    description:
      "Your free daily Islamic companion. Read Quran, listen to recitations, browse duas, track prayer times, and explore prophet stories.",
    images: ["/icon-512.png"],
  },
  category: "education",
  classification: "Educational - Islamic Studies",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0D4B3C" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1A14" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Preconnect to external origins for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.alquran.cloud" />
        <link rel="preconnect" href="https://cdn.islamic.network" />

        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* PWA / Mobile meta tags */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Wird" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Wird" />
        <meta name="msapplication-TileColor" content="#0D4B3C" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />

        {/* DNS prefetch for API domains */}
        <link rel="dns-prefetch" href="https://api.alquran.cloud" />
        <link rel="dns-prefetch" href="https://cdn.islamic.network" />
        <link rel="dns-prefetch" href="https://nominatim.openstreetmap.org" />

        {/* Service Worker Registration */}
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

        {/* JSON-LD Structured Data for SEO */}
        <StructuredData />
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
