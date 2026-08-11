import 'server-only';

export class RequestBodyError extends Error {
  constructor(code, status) {
    super(code);
    this.name = 'RequestBodyError';
    this.code = code;
    this.status = status;
  }
}

const isJsonContentType = (value) => /^(application\/json|application\/[a-z0-9.+-]+\+json)(?:\s*;|$)/i.test(value || '');

export const readBoundedJsonBody = async (request, { maxBytes }) => {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new TypeError('maxBytes must be a positive safe integer');
  }

  if (!isJsonContentType(request.headers.get('content-type'))) {
    throw new RequestBodyError('unsupported_media_type', 415);
  }

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestBodyError('payload_too_large', 413);
  }

  const reader = request.body?.getReader();
  if (!reader) return { rawBody: '', body: {} };

  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel('payload_too_large').catch(() => {});
      throw new RequestBodyError('payload_too_large', 413);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let rawBody;
  try {
    rawBody = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new RequestBodyError('invalid_utf8', 400);
  }

  try {
    return { rawBody, body: JSON.parse(rawBody || '{}') };
  } catch {
    throw new RequestBodyError('invalid_json', 400);
  }
};
