import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const project = 'demo-secondevie-backoffice';
for (const name of ['GOOGLE_APPLICATION_CREDENTIALS','FIREBASE_TOKEN','CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE']) {
  if (process.env[name]) throw new Error('Cloud credentials forbidden');
}
const result=spawnSync(process.execPath,[require.resolve('firebase-tools/lib/bin/firebase.js'),'emulators:exec','--only','firestore','--project',project,`"${process.execPath}" --test tests/backoffice-emulator.test.cjs`],{
  stdio:'inherit',env:{...process.env,GCLOUD_PROJECT:project,GOOGLE_CLOUD_PROJECT:project,CI:'true',FIREBASE_CLI_DISABLE_UPDATE_CHECK:'true'}
});
process.exitCode=result.status??1;
