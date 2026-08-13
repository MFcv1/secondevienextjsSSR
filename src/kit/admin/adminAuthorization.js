import { getFirebaseAuth } from '../config/firebaseLazy';
import { getFreshAdminIdToken } from './adminTokenRetry';

export async function refreshAdminAuthorizationToken() {
  const auth = await getFirebaseAuth();
  if (typeof auth.authStateReady === 'function') await auth.authStateReady();
  const user = auth.currentUser;
  if (!user || user.isAnonymous) {
    throw Object.assign(
      new Error('Session administrateur absente.'),
      { code: 'auth/admin-session-missing' }
    );
  }
  return getFreshAdminIdToken(user);
}
