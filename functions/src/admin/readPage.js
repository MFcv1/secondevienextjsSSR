'use strict';
const admin = require('firebase-admin');
const { HttpsError } = require('firebase-functions/v1/https');

async function readAdminPage({ collection, sortField, pageSize, cursor, referenceField, reference }) {
    if (cursor && (typeof cursor !== 'string' || cursor.length > 200 || !/^[\w-]+$/.test(cursor))) throw new HttpsError('invalid-argument', 'Curseur invalide.');
    if (reference && (typeof reference !== 'string' || reference.length > 80)) throw new HttpsError('invalid-argument', 'Référence invalide.');
    let query = reference ? collection.where(referenceField, '==', reference.trim()) : collection.orderBy(sortField, 'desc');
    query = query.orderBy(admin.firestore.FieldPath.documentId(), 'desc');
    if (cursor) {
        const snapshot = await collection.doc(cursor).get();
        if (!snapshot.exists) throw new HttpsError('invalid-argument', 'Curseur expiré. Actualisez la liste.');
        query = query.startAfter(snapshot);
    }
    const snapshot = await query.limit(pageSize + 1).get();
    const docs = snapshot.docs.slice(0, pageSize);
    const hasMore = snapshot.size > pageSize;
    return { docs, hasMore, nextCursor: hasMore ? docs.at(-1).id : null, coverage: hasMore ? 'partial' : 'complete' };
}

module.exports = { readAdminPage };
