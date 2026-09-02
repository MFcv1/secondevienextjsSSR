import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '../../../src/lib/server/adminAuthorization';
import { publicEnv } from '../../../src/lib/server/env';
import { readBoundedJsonBody, RequestBodyError } from '../../../src/lib/server/requestBody';
import {
  getCatalogRevalidationTargets,
  validateCatalogRevalidationBody,
  verifyCatalogMachineSignature,
} from '../../../src/lib/server/catalogRevalidationContract';

export const dynamic = 'force-dynamic';

const verifyMachineSignature = (request, rawBody) => {
  const secret = process.env.CATALOG_REVALIDATION_HMAC_SECRET || '';
  return verifyCatalogMachineSignature({
    secret,
    timestamp: request.headers.get('x-catalog-timestamp') || '',
    signature: request.headers.get('x-catalog-signature') || '',
    rawBody,
  });
};

export async function POST(request) {
  let rawBody;
  let body;
  try {
    ({ rawBody, body } = await readBoundedJsonBody(request, { maxBytes: 512 * 1024 }));
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const machineAuthenticated = verifyMachineSignature(request, rawBody);
  if (!machineAuthenticated) {
    const adminCheck = await authorizeAdminRequest(request);
    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }
  }

  let contract;
  try {
    contract = validateCatalogRevalidationBody(body, {
      projectId: publicEnv.projectId,
      audience: publicEnv.siteUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'invalid_contract' }, { status: 400 });
  }
  const { pathEntries } = getCatalogRevalidationTargets(contract);
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
    paths: pathEntries.map(({ path }) => path),
    pathEntries,
    reason: machineAuthenticated ? 'catalog_publication' : 'admin_update',
    machineAuthenticated
  });
}
