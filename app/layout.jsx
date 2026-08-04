import '../src/index.css';
import {
  Cormorant_Garamond,
  DM_Serif_Display,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import RouteTransitionIsland from './RouteTransitionIsland';
import ViewportHeightSyncIsland from './ViewportHeightSyncIsland';
import SupportChatLauncherIsland from '../src/kit/marketplace/SupportChatLauncherIsland';
import AnalyticsCollectorIsland from './AnalyticsCollectorIsland';
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

const productReturnBootScript = `
try {
  var pendingKey = 'secondevie:product-return-pending:v1';
  var returnKey = 'secondevie:product-return:v1';
  var currentHref = window.location.pathname + (window.location.search || '') + (window.location.hash || '');
  var pendingHref = window.sessionStorage && window.sessionStorage.getItem(pendingKey);
  var rawReturn = window.sessionStorage && window.sessionStorage.getItem(returnKey);
  var savedReturn = rawReturn ? JSON.parse(rawReturn) : null;
  var savedAt = Number(savedReturn && savedReturn.savedAt || 0);
  var committedAt = Number(savedReturn && savedReturn.committedAt || 0);
  var freshReturn = savedAt > 0 && Date.now() - savedAt <= 1800000;
  var freshCommit = committedAt <= 0 || Date.now() - committedAt <= 5000;

  if (pendingHref === currentHref && freshReturn && freshCommit) {
    document.documentElement.setAttribute('data-product-return-pending', 'true');
  } else if (pendingHref === currentHref) {
    window.sessionStorage.removeItem(pendingKey);
    window.sessionStorage.removeItem(returnKey);
  }
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon_final.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '192x192', type: 'image/png' },
    ],
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
  themeColor: '#FAFAF9',
  colorScheme: 'light',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={fontVariables} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="//firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="" />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: productReturnBootScript }} />
      </head>
      <body>
        <ViewportHeightSyncIsland />
        {children}
        <RouteTransitionIsland />
        <SupportChatLauncherIsland />
        <AnalyticsCollectorIsland />
      </body>
    </html>
  );
}
