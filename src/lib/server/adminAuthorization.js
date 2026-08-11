import 'server-only';

import { createHash } from 'node:crypto';
import { getAdminAppCheck, getAdminAuth, getAdminDb } from './firebaseAdmin';

const ADMIN_ACCESS_COLLECTION = 'sys_admin_access';
const MAX_BEARER_TOKEN_LENGTH = 8192;

const hashUid = (uid) => createHash('sha256').update(String(uid || '')).digest('hex').slice(0, 16);

const warnDenied = (request, reason, uid = '') => {
  console.warn('[admin-authorization] request denied', {
    reason,
    uidHash: uid ? hashUid(uid) : null,
    path: new URL(request.url).pathname,
  });
};

const getBearerToken = (request) => {
  const match = (request.headers.get('authorization') || '').match(/^Bearer\s+([^\s]+)$/i);
  const token = match?.[1] || '';
  return token.length <= MAX_BEARER_TOKEN_LENGTH ? token : '';
};

const hasAal2 = (decoded) => {
  const provider = decoded.firebase?.sign_in_provider || null;
  const verifiedPasskey = decoded.authMethod === 'passkey'
    && decoded.authAssurance === 'aal2'
    && decoded.userVerified === true;
  return provider === 'google.com' || verifiedPasskey;
};

export const authorizeAdminRequest = async (request, { requireOwner = false } = {}) => {
  const appCheckToken = request.headers.get('x-firebase-appcheck') || '';
  if (!appCheckToken || appCheckToken.length > 4096) {
    warnDenied(request, 'app-check-required');
    return { ok: false, status: 401, error: 'unauthorized' };
  }

  const appCheck = getAdminAppCheck();
  if (!appCheck) return { ok: false, status: 503, error: 'authorization_unavailable' };
  try {
    await appCheck.verifyToken(appCheckToken);
  } catch (error) {
    warnDenied(request, `invalid_app_check:${error?.code || 'unknown'}`);
    return { ok: false, status: 401, error: 'unauthorized' };
  }

  const token = getBearerToken(request);
  if (!token) {
    warnDenied(request, 'missing_or_malformed_token');
    return { ok: false, status: 401, error: 'unauthorized' };
  }

  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!auth || !db) return { ok: false, status: 503, error: 'authorization_unavailable' };

  let decoded;
  try {
    decoded = await auth.verifyIdToken(token, true);
  } catch (error) {
    warnDenied(request, `invalid_token:${error?.code || 'unknown'}`);
    return { ok: false, status: 401, error: 'unauthorized' };
  }

  const hasAdminClaim = decoded.admin === true || decoded.superAdmin === true;
  if (!hasAdminClaim || !hasAal2(decoded)) {
    warnDenied(request, !hasAdminClaim ? 'admin_claim_required' : 'aal2_required', decoded.uid);
    return { ok: false, status: 403, error: 'forbidden' };
  }

  try {
    const accessSnap = await db.collection(ADMIN_ACCESS_COLLECTION).doc(decoded.uid).get();
    const access = accessSnap.exists ? accessSnap.data() : null;
    if (!access || access.active !== true || (requireOwner && access.role !== 'owner')) {
      warnDenied(request, requireOwner ? 'owner_registry_required' : 'active_registry_required', decoded.uid);
      return { ok: false, status: 403, error: 'forbidden' };
    }
    return { ok: true, decoded, access };
  } catch (error) {
    console.error('[admin-authorization] registry lookup failed', { code: error?.code || 'unknown' });
    return { ok: false, status: 503, error: 'authorization_unavailable' };
  }
};
