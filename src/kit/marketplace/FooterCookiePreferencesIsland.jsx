'use client';

import { openCookiePreferences } from '../shared/cookieConsent';

export default function FooterCookiePreferencesIsland() {
  return (
    <button type="button" onClick={openCookiePreferences} className="min-h-11 cursor-pointer text-left text-sm hover:text-orange-500 focus-visible:outline-2 focus-visible:outline-offset-4">
      Gérer mes cookies
    </button>
  );
}
