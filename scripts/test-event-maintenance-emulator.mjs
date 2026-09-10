import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
for (const key of ['GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_TOKEN', 'CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE']) {
    if (process.env[key]) throw new Error('Cloud credentials forbidden in Emulator gate');
}
const project = 'demo-secondevie-events';
const testFile = process.argv.includes('--grouped') ? 'tests/grouped-inactivity-emulator.test.cjs' : 'tests/durable-maintenance-emulator.test.cjs';
const result = spawnSync(process.execPath, [require.resolve('firebase-tools/lib/bin/firebase.js'),
    'emulators:exec', '--only', 'firestore', '--project', project,
    `"${process.execPath}" --test ${testFile}`
], { cwd: fileURLToPath(new URL('../', import.meta.url)), stdio: 'inherit', env: {
    ...process.env, GCLOUD_PROJECT: project, GOOGLE_CLOUD_PROJECT: project, CI: 'true', FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true'
} });
process.exitCode = result.status ?? 1;
