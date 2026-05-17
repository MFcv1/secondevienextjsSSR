import '../src/index.css';
import {
  Cormorant_Garamond,
  DM_Serif_Display,
  Manrope,
  Newsreader,
  Playfair_Display,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import { publicEnv } from '../src/lib/server/env';

const siteName = publicEnv.siteName;
const description = publicEnv.siteDescription || 'Mobilier restaure avec passion.';
const siteUrl = publicEnv.siteUrl;
const ogImage = publicEnv.ogImage || '/og-image.jpg';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  preload: false,
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  preload: false,
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
  preload: false,
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: '700',
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
  preload: false,
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
