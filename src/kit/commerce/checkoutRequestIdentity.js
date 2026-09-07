const keyFor = (uid) => `secondevie:checkout-request:v1:${uid}`;

export async function getCheckoutRequestIdentity(ownerUid, input) {
    const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(input)));
    const signature = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const key = keyFor(ownerUid);
    const prepare = () => {
        const current = JSON.parse(window.localStorage.getItem(key) || 'null');
        if (current?.signature === signature && current.clientOrderId) return current.clientOrderId;
        const clientOrderId = `checkout_${window.crypto.randomUUID()}`;
        window.localStorage.setItem(key, JSON.stringify({ signature, clientOrderId }));
        return clientOrderId;
    };
    // Tabs share a request identity before the first network boundary.
    return window.navigator.locks
        ? window.navigator.locks.request(key, prepare)
        : prepare();
}

export function clearCheckoutRequestIdentity(ownerUid, clientOrderId) {
    if (typeof window === 'undefined' || !ownerUid || !clientOrderId) return;
    const key = keyFor(ownerUid);
    try {
        if (JSON.parse(window.localStorage.getItem(key) || 'null')?.clientOrderId === clientOrderId) window.localStorage.removeItem(key);
    } catch { /* An unreadable descriptor cannot authorize a new checkout. */ }
}
