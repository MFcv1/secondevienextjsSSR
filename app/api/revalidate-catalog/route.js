import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAdminAuth } from '../../../src/lib/server/firebaseAdmin';
import { publicEnv } from '../../../src/lib/server/env';
import {
  getCatalogRevalidationTargets,
  validateCatalogRevalidationBody,
  verifyCatalogMachineSignature,
} from '../../../src/lib/server/catalogRevalidationContract';

export const dynamic = 'force-dynamic';

const getBearerToken = (request) => {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
};

const verifyMachineSignature = (request, rawBody) => {
  const secret = process.env.CATALOG_REVALIDATION_HMAC_SECRET || '';
  return verifyCatalogMachineSignature({
    secret,
    timestamp: request.headers.get('x-catalog-timestamp') || '',
    signature: request.headers.get('x-catalog-signature') || '',
    rawBody,
  });
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
  let contract;
  try {
    contract = validateCatalogRevalidationBody(body, {
      projectId: publicEnv.projectId,
      audience: publicEnv.siteUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'invalid_contract' }, { status: 400 });
  }
  const { tags, pathEntries } = getCatalogRevalidationTargets(contract);
  tags.forEach((tag) => revalidateTag(tag));
  pathEntries.forEach(({ path, type }) => {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  });

  return NextResponse.json({
    ok: true,
    projectId: publicEnv.projectId,
    acceptedRevision: contract.revision,
    manifestSha256: contract.manifestSha256,
    aggregateSha256: contract.aggregateSha256,
    planHash: contract.planHash,
    mode: contract.mode,
    tags,
    paths: pathEntries.map(({ path }) => path),
    pathEntries,
    reason: machineAuthenticated ? 'catalog_publication' : 'admin_update',
    machineAuthenticated
  });
}
