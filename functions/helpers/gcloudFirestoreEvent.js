'use strict';

const PROJECT_ID = 'secondevienextjsssr';
const DATABASE_ID = '(default)';

function firestoreCloudEvent(payload, context, document) {
    if (payload && !Buffer.isBuffer(payload) && payload.data && payload.document) {
        return payload;
    }
    const resourceName = String(context?.resource?.name || context?.resource || '');
    const resourceDocument = resourceName.match(/\/documents\/(.+)$/)?.[1] || null;
    const resolvedDocument = typeof document === 'string' && !document.includes('/undefined')
        ? document
        : resourceDocument;
    if (!resolvedDocument) {
        throw new Error('FIRESTORE_EVENT_DOCUMENT_MISSING');
    }
    return {
        specversion: '1.0',
        id: String(context?.eventId || context?.id || ''),
        type: String(context?.eventType || context?.type || 'google.cloud.firestore.document.v1.written'),
        source: `//firestore.googleapis.com/projects/${PROJECT_ID}/databases/${DATABASE_ID}`,
        subject: `documents/${resolvedDocument}`,
        time: String(context?.timestamp || context?.time || new Date().toISOString()),
        datacontenttype: Buffer.isBuffer(payload) ? 'application/protobuf' : 'application/json',
        data: payload,
        project: PROJECT_ID,
        database: DATABASE_ID,
        namespace: DATABASE_ID,
        document: resolvedDocument
    };
}

module.exports = { firestoreCloudEvent };
