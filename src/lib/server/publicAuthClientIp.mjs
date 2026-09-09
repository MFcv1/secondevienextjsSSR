import { isIP } from 'node:net';

// Requires a verified ingress chain. Never choose a user-supplied leftmost IP.
// Keep the route disabled until this count AND rejection of direct ingress are qualified.
export function resolvePublicAuthClientIp(request, trustedProxyHops) {
  const hops = Number(trustedProxyHops);
  if (!Number.isInteger(hops) || hops < 1 || hops > 4) return null;
  const raw = request.headers.get('x-forwarded-for') || '';
  if (!raw || raw.length > 2048) return null;
  const entries = raw.split(',').map(value => value.trim());
  if (entries.length < hops || entries.length > 20) return null;
  const candidate = entries[entries.length - hops];
  if (!isIP(candidate)) return null;
  return isIP(candidate) === 6 ? new URL(`http://[${candidate}]/`).hostname.slice(1, -1) : candidate;
}
