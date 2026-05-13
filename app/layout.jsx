import '../src/index.css';
import '../src/kit/ui/TextType.css';
import '../src/kit/ui/CurvedLoop.css';
import '../src/kit/admin/PerformanceArchitectureStudy.css';

const siteName = process.env.NEXT_PUBLIC_BRAND_NAME || 'Seconde Vie';
const description = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Mobilier restaure avec passion.';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const ogImage = process.env.NEXT_PUBLIC_OG_IMAGE || '/og-image.jpg';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  description,
  openGraph: {
    type: 'website',
    siteName,
    title: siteName,
    description,
    images: [ogImage]
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description,
    images: [ogImage]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
