import '../src/index.css';
import {
  Cormorant_Garamond,
  DM_Serif_Display,
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

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
  preload: false,
});

const fontVariables = [
  plusJakarta.variable,
  cormorant.variable,
  dmSerif.variable,
].join(' ');

const themeBootScript = `
try {
  var stored = window.localStorage && window.localStorage.getItem('darkMode');
  var match = document.cookie.match(/(?:^|; )darkMode=([^;]*)/);
  var cookieValue = match ? decodeURIComponent(match[1]) : '';
  var isDark = (stored || cookieValue) === 'true';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.dataset.svTheme = isDark ? 'dark' : 'light';
} catch (error) {}
`;

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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#18100c',
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={fontVariables} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="" />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
