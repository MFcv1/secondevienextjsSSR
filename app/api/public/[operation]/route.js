import { handlePublicOperation } from '../../../../src/lib/server/publicOperations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, context) {
  const { operation } = await context.params;
  return handlePublicOperation(request, operation);
}
