import { getPasskeyHandlerName } from '../../../shared/passkeyTransport.mjs';

const ERROR_STATUS = Object.freeze({
  'invalid-argument': 400, 'unauthenticated': 401, 'permission-denied': 403,
  'not-found': 404, 'resource-exhausted': 429, 'failed-precondition': 400,
  'aborted': 409, 'deadline-exceeded': 504, 'unavailable': 503, 'internal': 500,
  'already-exists': 409, 'out-of-range': 400, 'unimplemented': 501, 'data-loss': 500,
});
const PRIVATE_HEADERS = {
  'cache-control': 'private, no-store, max-age=0',
  'x-robots-tag': 'noindex, nofollow, noarchive',
};

export class PasskeyHttpError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

const failure = (code, message, status = ERROR_STATUS[code], details) => Response.json({
  error: {
    status: code.toUpperCase().replaceAll('-', '_'), message,
    ...(details === undefined ? {} : { details }),
  },
}, { status, headers: PRIVATE_HEADERS });

// Callable-compatible wire format; Firebase's browser SDK still sends Auth and App Check.
// No fallback/retry to a second transport after a possibly committed operation.
export function createPasskeyPost({
  enabled, origin, verifyAppCheck, verifyIdToken, resolveClientIp, readBody, getHandlers,
  resolveOperation = (operation) => {
    const handler = getPasskeyHandlerName(operation);
    return handler ? { handler, auth: operation.includes('Registration'), ip: true, passkey: true } : null;
  },
  reportPerformance = () => {},
  log = console.error,
}) {
  return async (request, operation) => {
    const policy = resolveOperation(operation);
    if (!policy) return failure('not-found', 'Operation inconnue.');
    if (!enabled(operation)) return failure('unavailable', 'Service indisponible.');
    if (request.method !== 'POST') return failure('invalid-argument', 'POST requis.', 405);
    if (request.headers.get('origin') !== origin()) {
      return failure('permission-denied', 'Origine non autorisee.');
    }
    const startedAt = performance.now();
    const timing = {};
    try {
      const { body } = await readBody(request, { maxBytes: 64 * 1024 });
      if (!body || Array.isArray(body) || typeof body !== 'object'
        || Object.keys(body).length !== 1 || !Object.hasOwn(body, 'data')
        || !body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
        throw new PasskeyHttpError('invalid-argument', 'Requete invalide.');
      }
      if (policy.passkey && Object.hasOwn(body.data, 'origin') && body.data.origin !== request.headers.get('origin')) {
        throw new PasskeyHttpError('permission-denied', 'Origine passkey non autorisee.');
      }
      const appCheckToken = request.headers.get('x-firebase-appcheck') || '';
      if (!appCheckToken || appCheckToken.length > 4096) {
        throw new PasskeyHttpError('unauthenticated', 'App Check requis.');
      }
      let app;
      let stageStartedAt = performance.now();
      try { app = await verifyAppCheck(appCheckToken); }
      catch { throw new PasskeyHttpError('unauthenticated', 'App Check invalide.'); }
      finally { timing.appCheckMs = performance.now() - stageStartedAt; }
      let auth;
      const authorization = request.headers.get('authorization');
      if (authorization !== null) {
        const match = authorization.match(/^Bearer ([^\s]+)$/i);
        if (!match || match[1].length > 16384) throw new PasskeyHttpError('unauthenticated', 'Session invalide.');
        let token;
        stageStartedAt = performance.now();
        try { token = await verifyIdToken(match[1]); }
        catch { throw new PasskeyHttpError('unauthenticated', 'Session invalide.'); }
        finally { timing.authMs = performance.now() - stageStartedAt; }
        auth = { uid: token.uid, token };
      }
      if (policy.auth && !auth) {
        throw new PasskeyHttpError('unauthenticated', 'Connexion requise.');
      }
      const ip = policy.ip ? resolveClientIp(request) : null;
      if (policy.ip && !ip) throw new PasskeyHttpError('unavailable', 'Service indisponible.');
      stageStartedAt = performance.now();
      const handlers = await getHandlers(operation);
      timing.loadMs = performance.now() - stageStartedAt;
      stageStartedAt = performance.now();
      const data = await handlers[policy.handler](body.data, {
        auth, app, rawRequest: { ip }, request,
      });
      timing.businessMs = performance.now() - stageStartedAt;
      return Response.json({ data }, { headers: PRIVATE_HEADERS });
    } catch (error) {
      if (error instanceof PasskeyHttpError && Object.hasOwn(ERROR_STATUS, error.code)) {
        return failure(error.code, error.message, ERROR_STATUS[error.code], error.details);
      }
      if (error?.name === 'RequestBodyError') {
        return failure('invalid-argument', 'Requete invalide.', error.status);
      }
      log('public_passkey_failed', { operation });
      return failure('internal', 'Connexion passkey indisponible.');
    } finally {
      try { reportPerformance({ operation, ...timing, totalMs: performance.now() - startedAt }); }
      catch { /* Metrics must never change a committed business response. */ }
    }
  };
}
