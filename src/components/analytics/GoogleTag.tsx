/**
 * @file GoogleTag.tsx
 * @description Site-wide Google tag (one tag only; its GA4 destination is configured in Google's UI).
 * Renders nothing when NEXT_PUBLIC_GOOGLE_TAG_ID is not set, so local dev sends no data.
 * Page views come from GA4 Enhanced Measurement (history changes), not from manual events.
 */

import Script from 'next/script';

const GOOGLE_TAG_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;

export function GoogleTag() {
  if (!GOOGLE_TAG_ID) return null;
  return (
    <>
      <Script
        id="google-tag"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GOOGLE_TAG_ID)}`}
      />
      <Script id="google-tag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`}
      </Script>
    </>
  );
}
