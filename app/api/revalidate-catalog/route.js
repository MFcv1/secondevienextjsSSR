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
    const isAdmin = decoded.admin === true || (superAdminEmail && decoded.email === superAdminEmail);
    if (!isAdmin) {
      return { ok: false, response: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
    }
    return { ok: true, decoded };
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'invalid_token', detail: error?.message || String(error) }, { status: 401 })
    };
  }
};

export async function POST(request) {
  const adminCheck = await assertAdmin(request);
  if (!adminCheck.ok) return adminCheck.response;

  const body = await request.json().catch(() => ({}));
  const productId = typeof body.productId === 'string' ? body.productId : '';
  const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds.filter((item) => typeof item === 'string') : [];
  const paths = Array.isArray(body.paths) ? body.paths.map(normalizePath).filter(Boolean) : [];

  const tags = new Set(['catalog', 'products', 'categories']);
  if (productId) tags.add(`product:${productId}`);
  categoryIds.forEach((categoryId) => tags.add(`category:${categoryId}`));

  tags.forEach((tag) => revalidateTag(tag));

  const pathEntries = new Map();
  addRevalidationPath(pathEntries, '/');
  addRevalidationPath(pathEntries, '/galerie');
  addRevalidationPath(pathEntries, '/sitemap.xml');
  addRevalidationPath(pathEntries, '/categorie/[categoryId]', 'page');
  addRevalidationPath(pathEntries, '/produit/[slugOrId]', 'page');
  categoryIds.forEach((categoryId) => addRevalidationPath(pathEntries, `/categorie/${encodeURIComponent(categoryId)}`));
  if (productId) addRevalidationPath(pathEntries, `/produit/${encodeURIComponent(productId)}`);
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
    reason: body.reason || 'admin_update'
  });
}
