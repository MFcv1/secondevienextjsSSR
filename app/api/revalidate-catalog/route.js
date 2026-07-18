import crypto from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAdminAuth } from '../../../src/lib/server/firebaseAdmin';
import { publicEnv } from '../../../src/lib/server/env';

export const dynamic = 'force-dynamic';

const getBearerToken = (request) => {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
};

const normalizePath = (path) => {
  if (!path || typeof path !== 'string') return null;
  if (!path.startsWith('/')) return null;
  if (path.startsWith('/api/')) return null;
  return path;
};

const pathKey = ({ path, type }) => `${path}:${type || ''}`;
const MACHINE_AUTH_WINDOW_SECONDS = 5 * 60;

const timingSafeEqualHex = (left, right) => {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
};

const verifyMachineSignature = (request, rawBody) => {
  const secret = process.env.CATALOG_REVALIDATION_HMAC_SECRET || '';
  if (!secret) return false;
  const timestamp = request.headers.get('x-catalog-timestamp') || '';
  const signature = request.headers.get('x-catalog-signature') || '';
  const timestampSeconds = Number(timestamp);
  if (!Number.isInteger(timestampSeconds)) return false;
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds);
  if (ageSeconds > MACHINE_AUTH_WINDOW_SECONDS) return false;
  const bodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${bodyHash}`).digest('hex');
  return timingSafeEqualHex(signature, expected);
};

const addRevalidationPath = (pathEntries, path, type) => {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath) return;
  pathEntries.set(pathKey({ path: normalizedPath, type }), { path: normalizedPath, type });
};

const assertAdmin = async (request) => {
  const token = getBearerToken(request);
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: 'missing_token' }, { status: 401 }) };
  }

  const auth = getAdminAuth();
  if (!auth) {
    return { ok: false, response: NextResponse.json({ error: 'admin_auth_unavailable' }, { status: 503 }) };
  }

  try {
    const decoded = await auth.verifyIdToken(token, true);
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || '';
    const isAdmin = decoded.admin === true || decoded.superAdmin === true || (superAdminEmail && decoded.email === superAdminEmail);
    if (!isAdmin) {
      return { ok: false, response: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
    }
    return { ok: true, decoded };
  } catch (error) {
    console.warn('[revalidate-catalog] invalid Firebase ID token', {
      code: error?.code || 'unknown',
      message: error?.message || String(error),
    });
    return {
      ok: false,
      response: NextResponse.json({ error: 'invalid_token' }, { status: 401 })
    };
  }
};

export async function POST(request) {
  const rawBody = await request.text();
  const machineAuthenticated = verifyMachineSignature(request, rawBody);
  if (!machineAuthenticated) {
    const adminCheck = await assertAdmin(request);
    if (!adminCheck.ok) return adminCheck.response;
  }

  const body = (() => {
    try { return JSON.parse(rawBody || '{}'); } catch { return {}; }
  })();
  const productIds = Array.isArray(body.productIds)
    ? body.productIds.filter((item) => typeof item === 'string').slice(0, 120)
    : (typeof body.productId === 'string' && body.productId ? [body.productId] : []);
  const categoryIds = [
    ...(Array.isArray(body.categoryIds) ? body.categoryIds : []),
    ...(Array.isArray(body.previousCategories) ? body.previousCategories : []),
    ...(Array.isArray(body.nextCategories) ? body.nextCategories : []),
  ].filter((item) => typeof item === 'string').slice(0, 30);
  const paths = Array.isArray(body.paths) ? body.paths.map(normalizePath).filter(Boolean) : [];

  const tags = new Set(['catalog:pointer', 'catalog', 'products', 'categories', 'sitemap']);
  productIds.forEach((productId) => tags.add(`product:${productId}`));
  categoryIds.forEach((categoryId) => tags.add(`category:${categoryId}`));

  tags.forEach((tag) => revalidateTag(tag));

  const pathEntries = new Map();
  addRevalidationPath(pathEntries, '/');
  addRevalidationPath(pathEntries, '/galerie');
  addRevalidationPath(pathEntries, '/sitemap.xml');
  addRevalidationPath(pathEntries, '/categorie/[categoryId]', 'page');
  addRevalidationPath(pathEntries, '/produit/[slugOrId]', 'page');
  categoryIds.forEach((categoryId) => addRevalidationPath(pathEntries, `/categorie/${encodeURIComponent(categoryId)}`));
  productIds.forEach((productId) => addRevalidationPath(pathEntries, `/produit/${encodeURIComponent(productId)}`));
  paths.forEach((path) => addRevalidationPath(pathEntries, path));

  Array.from(pathEntries.values()).forEach(({ path, type }) => {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  });

  return NextResponse.json({
    ok: true,
    projectId: publicEnv.projectId,
    tags: Array.from(tags),
    paths: Array.from(pathEntries.values()).map(({ path }) => path),
    pathEntries: Array.from(pathEntries.values()),
    reason: body.reason || (machineAuthenticated ? 'catalog_publication' : 'admin_update'),
    revision: Number(body.revision || 0) || null,
    machineAuthenticated
  });
}
