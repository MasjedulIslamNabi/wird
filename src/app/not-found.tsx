import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <title>404 — Page Not Found | Wird</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href="/icon-192.png" />
      </head>
      <body className="bg-[#FBF7F0] dark:bg-[#0F1A14] min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden">
            <img src="/icon-192.png" alt="Wird" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-6xl font-bold text-[#0D4B3C] dark:text-[#C8A951] mb-2">404</h1>
          <h2 className="text-xl font-semibold text-[#1A1A2E] dark:text-[#E8E0D0] mb-3">
            Page Not Found
          </h2>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] mb-8 leading-relaxed">
            The page you are looking for does not exist or has been moved. May Allah guide you to what you seek.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0D4B3C] dark:bg-[#C8A951] text-white dark:text-[#0D4B3C] font-medium hover:opacity-90 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Go to Wird
          </Link>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-6 font-arabic">
            إِنَّ مَعَ الْعُسْرِ يُسْرًا
          </p>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            &quot;Indeed, with hardship comes ease.&quot; — Quran 94:6
          </p>
        </div>
      </body>
    </html>
  );
}
