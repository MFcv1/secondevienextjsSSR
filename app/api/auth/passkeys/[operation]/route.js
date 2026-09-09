import { handlePublicPasskey } from '../../../../../src/lib/server/publicPasskeys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, context) {
  const { operation } = await context.params;
  return handlePublicPasskey(request, operation);
}
