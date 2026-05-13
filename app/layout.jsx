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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,500&family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
