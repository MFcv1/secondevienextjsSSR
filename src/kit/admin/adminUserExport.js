export async function collectAdminUsers(call, isCurrent = () => true) {
    const users = new Map();
    const cursors = new Set();
    let pageToken;
    for (let page = 0; page < 20; page += 1) {
        if (!isCurrent()) throw new Error('Export interrompu : session modifiée.');
        const { data } = await call({ includeUsers: true, ...(pageToken ? { pageToken } : {}) });
        if (!isCurrent()) throw new Error('Export interrompu : session modifiée.');
        if (!Array.isArray(data?.users) || data.users.length > 500) throw new Error('Page utilisateurs invalide.');
        data.users.forEach(user => users.set(user.uid, user));
        pageToken = data.nextPageToken;
        if (!pageToken) return [...users.values()].sort((a, b) => Date.parse(b.creationTime) - Date.parse(a.creationTime));
        if (typeof pageToken !== 'string' || cursors.has(pageToken)) throw new Error('Pagination utilisateurs incohérente.');
        cursors.add(pageToken);
    }
    throw new Error('Export trop volumineux (10 000 comptes parcourus). Aucun fichier partiel téléchargé.');
}
