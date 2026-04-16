// JSON-LD Structured Data Component for Wird
// This component injects structured data into the page for SEO
// https://developers.google.com/search/docs/appearance/structured-data

export default function StructuredData() {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wird.app';

  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Wird',
    alternateName: 'Wird — Quran, Duas & Daily Practice',
    url: SITE_URL,
    description:
      'Your daily Islamic companion for reading the Quran, listening to recitations, daily duas, prayer times, prophet stories, and spiritual motivation.',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web, Android, iOS',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    inLanguage: ['en', 'ar', 'bn'],
    author: {
      '@type': 'Organization',
      name: 'Wird',
      url: SITE_URL,
    },
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    featureList: [
      'Quran Reader with Arabic text',
      'English and Bengali translations',
      'Audio recitations by multiple Qaris',
      'Daily duas with Arabic, English and Bengali',
      'Prayer times based on geolocation',
      'Prophet stories and lessons',
      'Dark mode support',
      'Offline-capable PWA',
    ],
    screenshot: `${SITE_URL}/icon-512.png`,
    installUrl: SITE_URL,
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Wird',
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    description:
      'Wird is a free, open-source Islamic web application providing Quran reading, dua collections, prayer times, and spiritual content.',
    sameAs: [],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Wird',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/?tab=quran&q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Wird',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1',
      bestRating: '5',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareAppSchema),
        }}
      />
    </>
  );
}
