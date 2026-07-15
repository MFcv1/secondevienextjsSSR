const CONSENT_COOKIE = 'sv_analytics_consent';
const PRODUCT_IUD_KEY = 'sv.analytics.v3.product_iud';

export function grantProductAnalyticsConsent(version = 'v1') {
  const safeVersion = String(version).replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 40) || 'v1';
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=product:${encodeURIComponent(safeVersion)}; Path=/; Max-Age=34128000; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent('secondevie:analytics-consent-changed'));
}

export async function withdrawProductAnalyticsConsent() {
  const subjectIud = window.localStorage.getItem(PRODUCT_IUD_KEY);
  if (subjectIud) {
    await fetch('/api/analytics/v3/privacy', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ subjectIud }),
    });
  }
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  window.localStorage.removeItem(PRODUCT_IUD_KEY);
  window.dispatchEvent(new CustomEvent('secondevie:analytics-consent-changed'));
}
