// 60 s heartbeats plus delivery/scheduling tolerance; not proof of a logged-in account.
export const LIVE_PRESENCE_MS = 150000;
export function isSessionOnline(session, now = Date.now()) {
    const last = typeof session?.lastActivityAt?.toMillis === 'function'
        ? session.lastActivityAt.toMillis() : Number(session?.lastActivityAt);
    return session?.sessionActive === true && Number.isFinite(last) && last > 0
        && now - last >= -10000 && now - last <= LIVE_PRESENCE_MS;
}
