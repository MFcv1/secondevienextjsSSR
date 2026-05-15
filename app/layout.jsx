import '../src/index.css';
import '../src/kit/ui/TextType.css';
import '../src/kit/ui/CurvedLoop.css';
import '../src/kit/admin/PerformanceArchitectureStudy.css';
import {
  Cormorant_Garamond,
  DM_Serif_Display,
  Manrope,
  Newsreader,
  Playfair_Display,
  Plus_Jakarta_Sans,
} from 'next/font/google';

const siteName = process.env.NEXT_PUBLIC_BRAND_NAME || 'Seconde Vie';
const description = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Mobilier restaure avec passion.';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const ogImage = process.env.NEXT_PUBLIC_OG_IMAGE || '/og-image.jpg';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: '700',
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const fontVariables = [
  plusJakarta.variable,
  cormorant.variable,
  newsreader.variable,
  manrope.variable,
  dmSerif.variable,
  playfair.variable,
].join(' ');

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  description,
  alternates: {
    canonical: '/'
  },
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
    <html lang="fr" className={fontVariables} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
