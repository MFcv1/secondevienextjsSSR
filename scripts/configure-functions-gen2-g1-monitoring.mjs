#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const DASHBOARD_NAME = 'Seconde Vie Sandbox - Functions Gen2 G1';
const SECONDARY_PUBSUB_TOPIC = `projects/${PROJECT_ID}/topics/monitoring-g1-alerts`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const LOG_METRICS = Object.freeze([
  {
    name: 'secondevie_commerce_worker_incomplete',
    description: 'Runs commerce incomplets, sans identifiant metier',
    filter: 'resource.type="cloud_function" "commerce_worker_incomplete"'
  },
  {
    name: 'secondevie_commerce_health_unhealthy',
    description: 'Sante commerce warning ou stop',
    filter: 'resource.type="cloud_function" "commerce_health_unhealthy"'
  },
  {
    name: 'secondevie_reservation_expiry_completed',
    description: 'Heartbeat du dispatcher expiration reservations',
    filter: 'resource.type="cloud_function" resource.labels.function_name="commerceReservationExpiryDispatcher" "commerce_worker_completed"'
  },
  {
    name: 'secondevie_outbox_completed',
    description: 'Heartbeat du dispatcher outbox commerce',
    filter: 'resource.type="cloud_function" resource.labels.function_name="commerceOutboxDispatcher" "commerce_worker_completed"'
  },
  {
    name: 'secondevie_payment_link_expiry_completed',
    description: 'Heartbeat expiration liens de paiement',
    filter: 'resource.type="cloud_function" resource.labels.function_name="expireAdminPaymentLinks" "commerce_worker_completed"'
  }
]);

const POLICIES = Object.freeze([
  {
    displayName: 'G1 Sandbox - Functions Gen1 execution errors',
    conditionName: 'Execution non-ok pendant 1 minute',
    filter: 'metric.type="cloudfunctions.googleapis.com/function/execution_count" AND resource.type="cloud_function" AND metric.label."status"!="ok"',
    duration: '60s',
    predicate: '> 0',
    aggregation: { alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_RATE' }
  },
  {
    displayName: 'G1 Sandbox - Cloud Run Gen2 5xx',
    conditionName: 'Reponse 5xx Cloud Run',
    filter: 'metric.type="run.googleapis.com/request_count" AND resource.type="cloud_run_revision" AND metric.label."response_code_class"="5xx"',
    duration: '60s',
    predicate: '> 0',
    aggregation: { alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_RATE' }
  },
  {
    displayName: 'G1 Sandbox - Cloud Tasks backlog',
    conditionName: 'Profondeur de queue non nulle pendant 5 minutes',
    filter: 'metric.type="cloudtasks.googleapis.com/queue/depth" AND resource.type="cloud_tasks_queue"',
    duration: '300s',
    predicate: '> 0',
    aggregation: { alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_MAX' }
  },
  {
    displayName: 'G1 Sandbox - Commerce worker incomplete',
    conditionName: 'Run commerce incomplet',
    filter: 'metric.type="logging.googleapis.com/user/secondevie_commerce_worker_incomplete" AND resource.type="cloud_function"',
    duration: '0s',
    predicate: '> 0',
    aggregation: { alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_RATE' }
  },
  {
    displayName: 'G1 Sandbox - Commerce health unhealthy',
    conditionName: 'Sante commerce warning ou stop',
    filter: 'metric.type="logging.googleapis.com/user/secondevie_commerce_health_unhealthy" AND resource.type="cloud_function"',
    duration: '0s',
    predicate: '> 0',
    aggregation: { alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_RATE' }
  },
  {
    displayName: 'G1 Sandbox - Reservation expiry heartbeat absent',
    conditionName: 'Aucune completion depuis 6 minutes',
    filter: 'metric.type="logging.googleapis.com/user/secondevie_reservation_expiry_completed" AND resource.type="cloud_function"',
    duration: '360s',
    predicate: 'absent',
    aggregation: { alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_RATE' }
  },
  {
    displayName: 'G1 Sandbox - Outbox heartbeat absent',
    conditionName: 'Aucune completion depuis 6 minutes',
    filter: 'metric.type="logging.googleapis.com/user/secondevie_outbox_completed" AND resource.type="cloud_function"',
    duration: '360s',
    predicate: 'absent',
    aggregation: { alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_RATE' }
  },
  {
    displayName: 'G1 Sandbox - Payment links heartbeat absent',
    conditionName: 'Aucune completion depuis 12 minutes',
    filter: 'metric.type="logging.googleapis.com/user/secondevie_payment_link_expiry_completed" AND resource.type="cloud_function"',
    duration: '720s',
    predicate: 'absent',
    aggregation: { alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_RATE' }
  }
]);

function fail(code) {
  throw new Error(code);
}

function parseArgs(argv) {
  const args = new Map();
  for (const argument of argv) {
    if (!argument.startsWith('--')) fail(`G1_MONITORING_ARGUMENT_INVALID:${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    args.set(key, parts.length ? parts.join('=') : 'true');
  }
  return args;
}

function gcloud(args, { json = false } = {}) {
  const output = execFileSync('gcloud', [...args, `--project=${PROJECT_ID}`], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return json ? JSON.parse(output || 'null') : output;
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function ensureEmailChannel({ email, role, apply, existing }) {
  if (!email) return null;
  const match = existing.find((channel) => (
    channel.type === 'email' && String(channel.labels?.email_address || '').toLowerCase() === email
  ));
  if (match) return { name: match.name, role, state: 'EXISTING' };
  if (!apply) return { name: null, role, state: 'PLANNED' };
  const created = gcloud([
    'beta', 'monitoring', 'channels', 'create',
    `--display-name=Seconde Vie G1 ${role}`,
    `--description=Canal ${role} des alertes sandbox Functions Gen2`,
    '--type=email',
    `--channel-labels=email_address=${email}`,
    `--user-labels=environment=sandbox,owner=secondevie,role=${role}`,
    '--format=json'
  ], { json: true });
  return { name: created.name, role, state: 'CREATED' };
}

function ensurePubSubChannel({ apply, existing }) {
  const match = existing.find((channel) => (
    channel.type === 'pubsub' && channel.labels?.topic === SECONDARY_PUBSUB_TOPIC
  ));
  if (match) return { name: match.name, role: 'secondary', state: 'EXISTING', type: 'pubsub' };
  if (!apply) return { name: null, role: 'secondary', state: 'PLANNED', type: 'pubsub' };
  const created = gcloud([
    'beta', 'monitoring', 'channels', 'create',
    '--display-name=Seconde Vie G1 secondary PubSub',
    '--description=Canal secondaire interne des alertes sandbox Functions Gen2',
    '--type=pubsub',
    `--channel-labels=topic=${SECONDARY_PUBSUB_TOPIC}`,
    '--user-labels=environment=sandbox,owner=secondevie,role=secondary',
    '--format=json'
  ], { json: true });
  return { name: created.name, role: 'secondary', state: 'CREATED', type: 'pubsub' };
}

function ensureLogMetric(definition, apply) {
  try {
    const current = gcloud(['logging', 'metrics', 'describe', definition.name, '--format=json'], { json: true });
    if (current.filter !== definition.filter) fail(`G1_LOG_METRIC_DRIFT:${definition.name}`);
    return { name: definition.name, state: 'EXISTING' };
  } catch (error) {
    if (String(error?.message || '').includes('G1_LOG_METRIC_DRIFT')) throw error;
    if (!apply) return { name: definition.name, state: 'PLANNED' };
    gcloud([
      'logging', 'metrics', 'create', definition.name,
      `--description=${definition.description}`,
      `--log-filter=${definition.filter}`,
      '--quiet'
    ]);
    return { name: definition.name, state: 'CREATED' };
  }
}

function ensurePolicy(definition, channels, apply, existing) {
  const current = existing.find((policy) => policy.displayName === definition.displayName);
  if (current) {
    const currentChannels = new Set(current.notificationChannels || []);
    const channelsComplete = channels.every((channel) => currentChannels.has(channel));
    if (channelsComplete) {
      return { name: current.name, displayName: definition.displayName, state: 'EXISTING' };
    }
    if (!apply) {
      return { name: current.name, displayName: definition.displayName, state: 'NEEDS_CHANNEL_UPDATE' };
    }
    gcloud([
      'monitoring', 'policies', 'update', current.name,
      `--set-notification-channels=${channels.join(',')}`,
      '--format=json'
    ]);
    return { name: current.name, displayName: definition.displayName, state: 'UPDATED_CHANNELS' };
  }
  if (!apply) return { name: null, displayName: definition.displayName, state: 'PLANNED' };
  const args = [
    'monitoring', 'policies', 'create',
    `--display-name=${definition.displayName}`,
    `--condition-display-name=${definition.conditionName}`,
    `--condition-filter=${definition.filter}`,
    `--duration=${definition.duration}`,
    `--if=${definition.predicate}`,
    `--aggregation=${JSON.stringify(definition.aggregation)}`,
    '--trigger-count=1',
    '--combiner=OR',
    '--user-labels=environment=sandbox,owner=secondevie,phase=g1',
    '--documentation=Runbook: apphostingaudit/runbooks/G1_OPERATIONS.md. Aucun secret ni identifiant metier dans les labels.',
    '--format=json'
  ];
  if (channels.length) args.push(`--notification-channels=${channels.join(',')}`);
  const created = gcloud(args, { json: true });
  return { name: created.name, displayName: definition.displayName, state: 'CREATED' };
}

function ensureDashboard(apply, existing) {
  const current = existing.find((dashboard) => dashboard.displayName === DASHBOARD_NAME);
  if (current) return { name: current.name, state: 'EXISTING' };
  if (!apply) return { name: null, state: 'PLANNED' };
  const created = gcloud([
    'monitoring', 'dashboards', 'create',
    `--config-from-file=${path.join(ROOT, 'apphostingaudit/monitoring/functions-gen2-g1-dashboard.json')}`,
    '--format=json'
  ], { json: true });
  return { name: created.name, state: 'CREATED' };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = args.get('apply') === 'true';
  if (args.get('project') !== PROJECT_ID || (args.get('env') || ENVIRONMENT) !== ENVIRONMENT) {
    fail('G1_MONITORING_TARGET_INVALID');
  }
  const project = gcloud(['projects', 'describe', PROJECT_ID, '--format=json'], { json: true });
  if (project.projectId !== PROJECT_ID) fail('G1_MONITORING_EFFECTIVE_PROJECT_INVALID');

  const channels = gcloud(['beta', 'monitoring', 'channels', 'list', '--format=json'], { json: true });
  const primary = ensureEmailChannel({
    email: normalizeEmail(process.env.SUPER_ADMIN_EMAIL),
    role: 'primary',
    apply,
    existing: channels
  });
  const secondarySource = args.get('secondary-source');
  if (secondarySource && !['gmail', 'pubsub'].includes(secondarySource)) {
    fail('G1_MONITORING_SECONDARY_SOURCE_INVALID');
  }
  const secondaryEmail = normalizeEmail(
    process.env.G1_ALERT_SECONDARY_EMAIL || (secondarySource === 'gmail' ? process.env.GMAIL_EMAIL : null)
  );
  if (secondaryEmail && secondaryEmail === normalizeEmail(process.env.SUPER_ADMIN_EMAIL)) {
    fail('G1_MONITORING_SECONDARY_MUST_BE_DISTINCT');
  }
  const secondary = secondarySource === 'pubsub'
    ? ensurePubSubChannel({ apply, existing: channels })
    : ensureEmailChannel({
        email: secondaryEmail,
        role: 'secondary',
        apply,
        existing: channels
      });
  if (!primary) fail('G1_MONITORING_PRIMARY_CHANNEL_MISSING');
  const channelNames = [primary, secondary].filter((channel) => channel?.name).map((channel) => channel.name);

  const metrics = LOG_METRICS.map((definition) => ensureLogMetric(definition, apply));
  const existingPolicies = gcloud(['monitoring', 'policies', 'list', '--format=json'], { json: true });
  const policies = POLICIES.map((definition) => ensurePolicy(definition, channelNames, apply, existingPolicies));
  const existingDashboards = gcloud(['monitoring', 'dashboards', 'list', '--format=json'], { json: true });
  const dashboard = ensureDashboard(apply, existingDashboards);

  process.stdout.write(`${JSON.stringify({
    ok: true,
    mode: apply ? 'APPLY' : 'PLAN',
    project: PROJECT_ID,
    environment: ENVIRONMENT,
    channels: [primary, secondary].filter(Boolean),
    redundancyReady: Boolean(primary?.name && secondary?.name),
    metrics,
    policies,
    dashboard
  }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: String(error?.message || error) })}\n`);
  process.exitCode = 1;
}
