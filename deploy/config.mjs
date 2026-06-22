export const PROJECT_NAME = 'Seconde Vie Next.js SSR';

export const SANDBOX = {
  name: 'sandbox',
  alias: 'default',
  projectId: 'secondevienextjsssr',
  envFile: '.env.sandbox',
  buildScript: 'build',
  appHostingBackendId: 'secondevie-next-sandbox',
  url: 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app',
  healthPath: '/galerie',
  rolloutConsoleUrl: 'https://console.firebase.google.com/project/secondevienextjsssr/apphosting/backends/secondevie-next-sandbox',
  label: 'SANDBOX',
};

export const DEPLOY_TARGETS = {
  appHosting: `apphosting:${SANDBOX.appHostingBackendId}`,
  functions: 'functions',
  firestore: 'firestore',
  storage: 'storage',
};

export const FORBIDDEN_IDS = [
  'secondevie-a0745',
  'tousatable-client',
  'tatmadeinnormandie',
];
