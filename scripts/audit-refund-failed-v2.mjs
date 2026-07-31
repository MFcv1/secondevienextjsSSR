import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import process from 'node:process';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const REGION = 'europe-west1';
const MINIMUM_REFUND_V2_DEPLOYED_AT = Date.parse('2026-07-31T14:03:00.000Z');
const REQUIRED_EVENTS = ['refund.created', 'refund.updated', 'refund.failed'];
const FUNCTION_NAMES = [
  'stripeWebhookV2',
  'stripeConnectWebhookV2',
  'getOrderTimelineAdminV2'
];
const require = createRequire(import.meta.url);
const Stripe = require('../functions/node_modules/stripe');

function invariant(condition, code) {
  if (!condition) throw new Error(code);
}

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) throw new Error(`Argument inconnu: ${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

function describeFunction(name) {
  const stdout = execFileSync('gcloud', [
    'functions',
    'describe',
    name,
    '--gen2',
    `--region=${REGION}`,
    `--project=${PROJECT_ID}`,
    '--format=json'
  ], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return JSON.parse(stdout);
}

function endpointSupports(endpoint) {
  const events = endpoint?.enabled_events || [];
  return endpoint?.status === 'enabled' &&
    (events.includes('*') || REQUIRED_EVENTS.every((event) => events.includes(event)));
}

function endpointDiagnostic(endpoint) {
  const events = endpoint?.enabled_events || [];
  return {
    found: Boolean(endpoint),
    status: endpoint?.status || null,
    missingEvents: events.includes('*')
      ? []
      : REQUIRED_EVENTS.filter((event) => !events.includes(event))
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  invariant(
    args.get('project') === PROJECT_ID &&
      (args.get('env') || ENVIRONMENT) === ENVIRONMENT,
    'REFUND_V2_TARGET_INVALID'
  );
  invariant(process.env.STRIPE_SECRET_KEY, 'REFUND_V2_STRIPE_KEY_MISSING');

  const functions = FUNCTION_NAMES.map((name) => {
    const descriptor = describeFunction(name);
    invariant(descriptor.state === 'ACTIVE', `REFUND_V2_FUNCTION_NOT_ACTIVE:${name}`);
    invariant(
      Date.parse(descriptor.updateTime) >= MINIMUM_REFUND_V2_DEPLOYED_AT,
      `REFUND_V2_DEPLOYMENT_TOO_OLD:${name}`
    );
    return {
      name,
      uri: descriptor.serviceConfig?.uri || descriptor.url,
      updateTime: descriptor.updateTime,
      state: descriptor.state
    };
  });

  const webhookFunctions = functions.filter(({ name }) => name.includes('Webhook'));
  for (const target of webhookFunctions) {
    invariant(
      target.uri === `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${target.name}`,
      `REFUND_V2_FUNCTION_URI_INVALID:${target.name}`
    );
    const response = await fetch(target.uri, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 'invalid-read-only-preflight'
      },
      body: '{}'
    });
    invariant(response.status === 400, `REFUND_V2_UNSIGNED_PROBE_UNEXPECTED:${target.name}`);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const platform = endpoints.data.find((endpoint) =>
    endpoint.url === webhookFunctions.find(({ name }) => name === 'stripeWebhookV2')?.uri
  );
  const connect = endpoints.data.find((endpoint) =>
    endpoint.url === webhookFunctions.find(({ name }) => name === 'stripeConnectWebhookV2')?.uri
  );
  invariant(
    !platform || endpointSupports(platform),
    `REFUND_V2_PLATFORM_EVENTS_NOT_READY:${JSON.stringify(endpointDiagnostic(platform))}`
  );
  invariant(
    endpointSupports(connect),
    `REFUND_V2_CONNECT_EVENTS_NOT_READY:${JSON.stringify(endpointDiagnostic(connect))}`
  );

  console.log(JSON.stringify({
    ok: true,
    status: 'READY',
    projectId: PROJECT_ID,
    environment: ENVIRONMENT,
    requiredEvents: REQUIRED_EVENTS,
    functions,
    stripeEndpoints: {
      platform: platform ? 'enabled' : 'not_configured_not_required',
      connect: 'enabled'
    }
  }));
}

try {
  await main();
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: String(error?.message || error)
  }));
  process.exitCode = 1;
}
