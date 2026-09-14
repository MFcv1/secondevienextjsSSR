import { getFirebaseAuth, getFirebaseAppCheckToken } from '../config/firebaseLazy';

export async function checkSandboxRestockEligibility(products, collectionName, signal) {
    const auth = await getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('AUTH_REQUIRED');
    const [idToken, appCheckToken] = await Promise.all([user.getIdToken(), getFirebaseAppCheckToken()]);
    if (!appCheckToken || signal.aborted || auth.currentUser?.uid !== user.uid) throw new Error('CHECK_UNAVAILABLE');
    const response = await fetch('/api/admin/sandbox-restock-eligibility', {
        method: 'POST', cache: 'no-store',
        signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
        headers: { 'content-type': 'application/json', authorization: `Bearer ${idToken}`,
            'x-firebase-appcheck': appCheckToken },
        body: JSON.stringify({ products, collectionName }),
    });
    if (!response.ok) throw new Error('CHECK_UNAVAILABLE');
    const payload = await response.json();
    if (auth.currentUser?.uid !== user.uid || !Array.isArray(payload?.results)) throw new Error('CHECK_UNAVAILABLE');
    return payload.results;
}
