import { spawnSync } from 'node:child_process';

const PROJECT_ID = 'secondevienextjsssr';
const TOPIC = 'admin-system-incidents';
const SINK = 'admin-system-incidents';
const RUN_SERVICE = 'projectsystemincidentgen2';
const REGION = 'europe-west1';
const RUNTIME_SERVICE_ACCOUNT = `observability-admin-runtime@${PROJECT_ID}.iam.gserviceaccount.com`;
const CONFIRMATION = 'CONFIGURE_SYSTEM_INCIDENT_STREAM';
const args = new Set(process.argv.slice(2));
const execute = args.has('--execute');
const confirmed = args.has(`--confirm=${CONFIRMATION}`);
const projectArg = [...args].find((arg) => arg.startsWith('--project='))?.split('=')[1] || PROJECT_ID;
const envArg = [...args].find((arg) => arg.startsWith('--env='))?.split('=')[1] || 'sandbox';
const destination = `pubsub.googleapis.com/projects/${PROJECT_ID}/topics/${TOPIC}`;
const filter = [
  '(resource.type="cloud_run_revision" OR resource.type="cloud_function")',
  '(severity>=ERROR OR (jsonPayload.event="function_failed" AND jsonPayload.expected=false))',
  'NOT httpRequest:*',
  'NOT resource.labels.service_name="projectsystemincidentgen2"',
  'NOT resource.labels.function_name="projectSystemIncidentGen2"',
  'logName!="projects/secondevienextjsssr/logs/monitoring.googleapis.com%2FViolationOpenEventv1"',
  'logName!="projects/secondevienextjsssr/logs/monitoring.googleapis.com%2FViolationAutoResolveEventv1"',
].join(' AND ');

if (projectArg !== PROJECT_ID || envArg !== 'sandbox') {
  throw new Error('Ce script est borne au sandbox secondevienextjsssr.');
}

const plan = {
  mode: execute ? 'execute' : 'dry-run',
  project: PROJECT_ID,
  topic: TOPIC,
  sink: SINK,
  destination,
  filter,
  writes: execute ? ['Pub/Sub topic', 'Cloud Logging sink', 'topic IAM binding', 'Cloud Run invoker binding'] : [],
};

if (!execute) {
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  process.exit(0);
}
if (!confirmed) {
  throw new Error(`Ajoutez --confirm=${CONFIRMATION} après autorisation explicite de la gate cloud.`);
}

function run(commandArgs, { allowFailure = false } = {}) {
  const result = spawnSync('gcloud', commandArgs, { encoding: 'utf8' });
  if (!allowFailure && result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `gcloud ${commandArgs[0]} a échoué`);
  }
  return result;
}

const topicExists = run(['pubsub', 'topics', 'describe', TOPIC, '--project', PROJECT_ID], { allowFailure: true }).status === 0;
if (!topicExists) run(['pubsub', 'topics', 'create', TOPIC, '--project', PROJECT_ID]);

const sinkDescription = run(['logging', 'sinks', 'describe', SINK, '--project', PROJECT_ID, '--format=json'], { allowFailure: true });
if (sinkDescription.status === 0) {
  run(['logging', 'sinks', 'update', SINK, destination, '--project', PROJECT_ID, '--log-filter', filter]);
} else {
  run(['logging', 'sinks', 'create', SINK, destination, '--project', PROJECT_ID, '--log-filter', filter]);
}

const sink = JSON.parse(run(['logging', 'sinks', 'describe', SINK, '--project', PROJECT_ID, '--format=json']).stdout);
if (!sink.writerIdentity) throw new Error('writerIdentity du sink introuvable.');
run([
  'pubsub', 'topics', 'add-iam-policy-binding', TOPIC,
  '--project', PROJECT_ID,
  '--member', sink.writerIdentity,
  '--role', 'roles/pubsub.publisher',
]);

const runServiceExists = run([
  'run', 'services', 'describe', RUN_SERVICE,
  '--project', PROJECT_ID,
  '--region', REGION,
], { allowFailure: true }).status === 0;
if (!runServiceExists) {
  throw new Error(`Service ${RUN_SERVICE} absent: deployez la Function avant de configurer son invoker.`);
}
run([
  'run', 'services', 'add-iam-policy-binding', RUN_SERVICE,
  '--project', PROJECT_ID,
  '--region', REGION,
  '--member', `serviceAccount:${RUNTIME_SERVICE_ACCOUNT}`,
  '--role', 'roles/run.invoker',
  '--quiet',
]);

process.stdout.write(`${JSON.stringify({ ...plan, writerIdentity: sink.writerIdentity, runInvoker: RUNTIME_SERVICE_ACCOUNT, status: 'configured' }, null, 2)}\n`);
