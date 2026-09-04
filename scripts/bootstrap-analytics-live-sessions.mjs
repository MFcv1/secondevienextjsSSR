import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const admin = require('../functions/node_modules/firebase-admin');
const { projectLiveSession } = require('../functions/src/analytics/liveSessions');
if (!process.argv.includes('--project=secondevienextjsssr') || process.env.FIRESTORE_EMULATOR_HOST) throw new Error('SANDBOX_ONLY');
const apply = process.argv.includes('--apply');
const app = admin.initializeApp({ projectId: 'secondevienextjsssr' });
try {
    const db = admin.firestore();
    const sources = await db.collection('analytics_sessions').select().limit(2001).get();
    if (sources.size > 2000) throw new Error('BOOTSTRAP_LIMIT');
    const outcomes = {};
    if (apply) for (const source of sources.docs) {
        const result = await projectLiveSession(source.id, db);
        outcomes[result] = (outcomes[result] || 0) + 1;
    }
    console.log(JSON.stringify({ apply, sources: sources.size, maximumWrites: sources.size * 2, outcomes }));
} finally { await app.delete(); }
