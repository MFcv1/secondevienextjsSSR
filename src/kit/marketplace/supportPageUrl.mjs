const SENSITIVE_PATH_PREFIXES = ['/payer'];

export function getSafeSupportPageUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return '';

    const sensitivePath = SENSITIVE_PATH_PREFIXES.some((prefix) => (
      url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
    ));

    if (sensitivePath) return url.origin;
    return `${url.origin}${url.pathname}`;
  } catch {
    return '';
  }
}
