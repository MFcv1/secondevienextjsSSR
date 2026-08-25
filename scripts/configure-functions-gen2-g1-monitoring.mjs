#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const DASHBOARD_NAME = 'Seconde Vie Sandbox - Functions Gen2 G1';
const SECONDARY_PUBSUB_TOPIC = `projects/${PROJECT_ID}/topics/monitoring-g1-alerts`;
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const POLICY_DOCUMENTATION = 'Runbook: apphostingaudit/runbooks/G1_OPERATIONS.md. Aucun secret ni identifiant metier dans les labels.';
const LOG_ALERT_RATE_LIMIT = '3600s';
const LOG_ALERT_AUTO_CLOSE = '21600s';
const DEFAULT_SECONDARY_SOURCE = 'pubsub';
const LEGACY_EXPECTED_ERROR_CLASSES = Object.freeze([
  'already-exists',
  'cancelled',
  'failed-precondition',
  'invalid-argument',
  'not-found',
  'permission-denied',
  'resource-exhausted',
  'unauthenticated'
]);
const MONITORING_VIOLATION_LOGS = Object.freeze([
  `projects/${PROJECT_ID}/logs/monitoring.googleapis.com%2FViolationOpenEventv1`,
  `projects/${PROJECT_ID}/logs/monitoring.googleapis.com%2FViolationAutoResolveEventv1`
]);

function applicationLogFilter(message) {
  return [
    '(resource.type="cloud_run_revision" OR resource.type="cloud_function")',
    ...MONITORING_VIOLATION_LOGS.map((logName) => `logName!="${logName}"`),
    `(jsonPayload.message="${message}" OR textPayload:"${message}")`
  ].join(' ');
}

function unexpectedFunctionFailureFilter() {
  const legacyExpected = `jsonPayload.errorClass=(${LEGACY_EXPECTED_ERROR_CLASSES.map((value) => `"${value}"`).join(' OR ')})`;
  return [
    '(resource.type="cloud_run_revision" OR resource.type="cloud_function")',
    ...MONITORING_VIOLATION_LOGS.map((logName) => `logName!="${logName}"`),
    'severity>=ERROR',
    'jsonPayload.event="function_failed"',
    `(jsonPayload.expected=false OR (NOT jsonPayload.expected:* AND NOT ${legacyExpected}))`
  ].join(' ');
}

function functionResourceFilter(legacyName, gen2ServiceName) {
  return `((resource.type="cloud_run_revision" resource.labels.service_name="${gen2ServiceName}") OR (resource.type="cloud_function" resource.labels.function_name="${legacyName}"))`;
}

const LOG_METRICS = Object.freeze([
  {
    name: 'secondevie_commerce_worker_incomplete',
    description: 'Runs commerce incomplets, sans identifiant metier',
    filter: applicationLogFilter('commerce_worker_incomplete')
  },
  {
    name: 'secondevie_commerce_health_unhealthy',
    description: 'Sante commerce warning ou stop',
    filter: applicationLogFilter('commerce_health_unhealthy')
  },
  {
    name: 'secondevie_reservation_expiry_completed',
    description: 'Heartbeat du dispatcher expiration reservations',
    filter: `${functionResourceFilter('commerceReservationExpiryDispatcher', 'commercereservationexpirydispatchergen2')} "commerce_worker_completed"`
  },
  {
    name: 'secondevie_outbox_completed',
    description: 'Heartbeat du dispatcher outbox commerce',
    filter: `${functionResourceFilter('commerceOutboxDispatcher', 'commerceoutboxdispatchergen2')} "commerce_worker_completed"`
  },
  {
    name: 'secondevie_payment_link_expiry_completed',
    description: 'Heartbeat expiration liens de paiement',
    filter: `${functionResourceFilter('expireAdminPaymentLinks', 'expireadminpaymentlinksgen2')} "commerce_worker_completed"`
  }
]);

const POLICIES = Object.freeze([
  {
    displayName: 'G1 Sandbox - Functions Gen1 execution errors',
    conditionName: 'Execution non-ok pendant 1 minute',
    filter: 'metric.type="cloudfunctions.googleapis.com/function/execution_count" AND resource.type="cloud_function" AND metric.label."status"!="ok"',
    duration: '60s',
    predicate: '> 0',
    aggregation: { alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_RATE' },
    severity: 'ERROR'
  },
  {
    displayName: 'G1 Sandbox - Cloud Run Gen2 5xx',
    conditionName: 'Reponse 5xx Cloud Run',
    filter: 'metric.type="run.googleapis.com/request_count" AND resource.type="cloud_run_revision" AND metric.label."response_code_class"="5xx"',
    duration: '60s',
    predicate: '> 0',
    aggregation: { alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_RATE' },
    severity: 'ERROR'
  },
  {
    displayName: 'G1 Sandbox - Cloud Tasks backlog',
    conditionName: 'Profondeur de queue non nulle pendant 5 minutes',
    filter: 'metric.type="cloudtasks.googleapis.com/queue/depth" AND resource.type="cloud_tasks_queue"',
    duration: '300s',
    predicate: '> 0',
    aggregation: { alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_MAX' },
    severity: 'WARNING'
  },
  {
    displayName: 'G1 Sandbox - Commerce worker incomplete',
    conditionName: 'Run commerce incomplet',
    logMatchFilter: applicationLogFilter('commerce_worker_incomplete'),
    severity: 'ERROR'
  },
  {
    displayName: 'G1 Sandbox - Commerce health unhealthy',
    conditionName: 'Sante commerce warning ou stop',
    logMatchFilter: applicationLogFilter('commerce_health_unhealthy'),
    severity: 'WARNING'
  },
  {
    displayName: 'G1 Sandbox - Analytics maintenance failed',
    conditionName: 'Archivage ou rollup analytics en echec',
    logMatchFilter: applicationLogFilter('analytics_maintenance_failed'),
    severity: 'ERROR'
  },
  {
    displayName: 'Sandbox - Unexpected application failure',
    conditionName: 'Erreur applicative inattendue à investiguer',
    logMatchFilter: unexpectedFunctionFailureFilter(),
    severity: 'ERROR'
  },
  {
    displayName: 'G1 Sandbox - Reservation expiry heartbeat absent',
    conditionName: 'Aucune completion depuis 6 minutes',
    filter: 'metric.type="logging.googleapis.com/user/secondevie_reservation_expiry_completed" AND resource.type="cloud_run_revision"',
    duration: '360s',
    predicate: 'absent',
    aggregation: { alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_RATE' },
    severity: 'WARNING'
  },
  {
    displayName: 'G1 Sandbox - Outbox heartbeat absent',
    conditionName: 'Aucune completion depuis 6 minutes',
    filter: 'metric.type="logging.googleapis.com/user/secondevie_outbox_completed" AND resource.type="cloud_run_revision"',
    duration: '360s',
    predicate: 'absent',
    aggregation: { alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_RATE' },
    severity: 'WARNING'
  },
  {
    displayName: 'G1 Sandbox - Payment links heartbeat absent',
    conditionName: 'Aucune completion depuis 12 minutes',
    filter: 'metric.type="logging.googleapis.com/user/secondevie_payment_link_expiry_completed" AND resource.type="cloud_run_revision"',
    duration: '720s',
    predicate: 'absent',
    aggregation: { alignmentPeriod: '60s', perSeriesAligner: 'ALIGN_RATE' },
    severity: 'WARNING'
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
  let current;
  try {
    current = gcloud(['logging', 'metrics', 'describe', definition.name, '--format=json'], { json: true });
  } catch (error) {
    const diagnostic = `${error?.message || ''}\n${error?.stderr || ''}`;
    if (!/NOT_FOUND|not found/i.test(diagnostic)) throw error;
    if (!apply) return { name: definition.name, state: 'PLANNED' };
    gcloud([
      'logging', 'metrics', 'create', definition.name,
      `--description=${definition.description}`,
      `--log-filter=${definition.filter}`,
      '--quiet'
    ]);
    return { name: definition.name, state: 'CREATED' };
  }
  if (current.filter !== definition.filter) {
    if (!apply) return { name: definition.name, state: 'NEEDS_FILTER_UPDATE' };
    gcloud([
      'logging', 'metrics', 'update', definition.name,
      `--description=${definition.description}`,
      `--log-filter=${definition.filter}`,
      '--quiet'
    ]);
    return { name: definition.name, state: 'UPDATED_FILTER' };
  }
  return { name: definition.name, state: 'EXISTING' };
}

function buildLogMatchPolicy(definition, channels, name = undefined) {
  return {
    ...(name ? { name } : {}),
    displayName: definition.displayName,
    documentation: {
      content: POLICY_DOCUMENTATION,
      mimeType: 'text/markdown'
    },
    userLabels: {
      environment: ENVIRONMENT,
      owner: 'secondevie',
      phase: 'g1'
    },
    conditions: [{
      displayName: definition.conditionName,
      conditionMatchedLog: {
        filter: definition.logMatchFilter
      }
    }],
    combiner: 'OR',
    enabled: true,
    notificationChannels: channels,
    alertStrategy: {
      notificationRateLimit: { period: LOG_ALERT_RATE_LIMIT },
      notificationPrompts: ['OPENED'],
      autoClose: LOG_ALERT_AUTO_CLOSE
    },
    severity: definition.severity
  };
}

function sameValues(left = [], right = []) {
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.length === sortedRight.length
    && sortedLeft.every((value, index) => value === sortedRight[index]);
}

function logMatchPolicyIsCurrent(current, definition, channels) {
  const condition = current.conditions?.length === 1 ? current.conditions[0] : null;
  return current.enabled !== false
    && current.severity === definition.severity
    && condition?.displayName === definition.conditionName
    && condition?.conditionMatchedLog?.filter === definition.logMatchFilter
    && current.alertStrategy?.notificationRateLimit?.period === LOG_ALERT_RATE_LIMIT
    && current.alertStrategy?.autoClose === LOG_ALERT_AUTO_CLOSE
    && sameValues(current.notificationChannels || [], channels);
}

function ensurePolicy(definition, channels, apply, existing) {
  const current = existing.find((policy) => policy.displayName === definition.displayName);
  if (definition.logMatchFilter) {
    if (current && logMatchPolicyIsCurrent(current, definition, channels)) {
      return { name: current.name, displayName: definition.displayName, state: 'EXISTING' };
    }
    if (!apply) {
      return {
        name: current?.name || null,
        displayName: definition.displayName,
        state: current ? 'NEEDS_POLICY_UPDATE' : 'PLANNED'
      };
    }
    const policy = buildLogMatchPolicy(definition, channels, current?.name);
    const operation = current ? 'update' : 'create';
    const args = ['monitoring', 'policies', operation];
    if (current) args.push(current.name);
    args.push(`--policy=${JSON.stringify(policy)}`, '--format=json');
    const updated = gcloud(args, { json: true });
    return {
      name: updated.name,
      displayName: definition.displayName,
      state: current ? 'UPDATED_POLICY' : 'CREATED'
    };
  }
  if (current) {
    const currentChannels = new Set(current.notificationChannels || []);
    const channelsComplete = channels.every((channel) => currentChannels.has(channel));
    const severityCurrent = current.severity === definition.severity;
    if (channelsComplete && severityCurrent) {
      return { name: current.name, displayName: definition.displayName, state: 'EXISTING' };
    }
    if (!apply) {
      return {
        name: current.name,
        displayName: definition.displayName,
        state: channelsComplete ? 'NEEDS_SEVERITY_UPDATE' : 'NEEDS_POLICY_UPDATE'
      };
    }
    if (!severityCurrent) {
      const policy = {
        name: current.name,
        displayName: current.displayName,
        documentation: current.documentation,
        userLabels: current.userLabels,
        conditions: current.conditions,
        combiner: current.combiner,
        enabled: current.enabled !== false,
        notificationChannels: channels,
        ...(current.alertStrategy ? { alertStrategy: current.alertStrategy } : {}),
        severity: definition.severity
      };
      const updated = gcloud([
        'monitoring', 'policies', 'update', current.name,
        `--policy=${JSON.stringify(policy)}`,
        '--format=json'
      ], { json: true });
      return { name: updated.name, displayName: definition.displayName, state: 'UPDATED_POLICY' };
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
    `--documentation=${POLICY_DOCUMENTATION}`,
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
  const primaryEmail = normalizeEmail(process.env.G1_ALERT_PRIMARY_EMAIL || process.env.SUPER_ADMIN_EMAIL);
  const primary = ensureEmailChannel({
    email: primaryEmail,
    role: 'primary',
    apply,
    existing: channels
  });
  const secondarySource = args.get('secondary-source') || DEFAULT_SECONDARY_SOURCE;
  if (!['gmail', 'pubsub'].includes(secondarySource)) {
    fail('G1_MONITORING_SECONDARY_SOURCE_INVALID');
  }
  const secondaryEmail = normalizeEmail(
    process.env.G1_ALERT_SECONDARY_EMAIL || (secondarySource === 'gmail' ? process.env.GMAIL_EMAIL : null)
  );
  if (secondaryEmail && secondaryEmail === primaryEmail) {
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

export {
  DEFAULT_SECONDARY_SOURCE,
  LOG_ALERT_AUTO_CLOSE,
  LOG_ALERT_RATE_LIMIT,
  LOG_METRICS,
  MONITORING_VIOLATION_LOGS,
  POLICIES,
  applicationLogFilter,
  unexpectedFunctionFailureFilter,
  buildLogMatchPolicy,
  logMatchPolicyIsCurrent
};

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ ok: false, error: String(error?.message || error) })}\n`);
    process.exitCode = 1;
  }
}
