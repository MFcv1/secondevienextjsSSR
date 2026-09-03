// Offline only. No Google client, credentials, database access or writes.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const { buildSeed } = createRequire(import.meta.url)('../functions/src/analytics/realtime.js');

export function prepareSeedReport(input) {
    if (!Number.isSafeInteger(input.now)) throw new Error('A fixed inventory timestamp is required');
    const seed = buildSeed(input);
    const digest = createHash('sha256').update(JSON.stringify(seed)).digest('hex');
    return { schemaVersion: 1, digest, cloudWrites: 0, readyForCutover: false,
        ledgerDocuments: Object.keys(seed.ledgers).length,
        bucketDocuments: Object.keys(seed.buckets).length,
        publicDocuments: 2,
        recentBytes: Buffer.byteLength(JSON.stringify(seed.recent)),
        historyBytes: Buffer.byteLength(JSON.stringify(seed.history)),
        historyComplete: seed.history.historyComplete,
        requiredGate: 'P4: source completeness, paused bootstrap, catch-up, shadow and rollback authorization' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        if (process.argv.length !== 4 || process.argv[2] !== '--input') throw new Error('arguments');
        console.log(JSON.stringify(prepareSeedReport(JSON.parse(readFileSync(process.argv[3], 'utf8'))), null, 2));
    } catch {
        console.error('Preparation refusee: utiliser --input avec un inventaire local valide. Aucune ecriture effectuee.');
        process.exitCode = 1;
    }
}
