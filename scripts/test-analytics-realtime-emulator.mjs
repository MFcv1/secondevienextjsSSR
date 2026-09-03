import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const project = 'demo-secondevie-analytics';
for (const name of ['GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_TOKEN', 'CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE']) {
    if (process.env[name]) throw new Error('Cloud credentials forbidden in Emulator gate');
}
const result = spawnSync(process.execPath, [require.resolve('firebase-tools/lib/bin/firebase.js'),
    'emulators:exec', '--only', 'firestore', '--project', project,
    `"${process.execPath}" --test tests/analytics-realtime-emulator.test.cjs`
], { cwd: fileURLToPath(new URL('../', import.meta.url)), stdio: 'inherit', env: {
    ...process.env, GCLOUD_PROJECT: project, GOOGLE_CLOUD_PROJECT: project, CI: 'true', FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true'
} });
process.exitCode = result.status ?? 1;
