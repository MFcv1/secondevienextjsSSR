import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMaintenanceMonitoring } from '../scripts/event-maintenance-monitoring.mjs';
import { planAlertRepair } from '../scripts/repair-deferred-queue-alerts.mjs';
import { DEFERRED_QUEUES, BACKLOG_FILTER } from '../scripts/lib/deferred-queue-alerts.mjs';

import {
  DEFAULT_SECONDARY_SOURCE,
  LOG_ALERT_AUTO_CLOSE,
  LOG_ALERT_RATE_LIMIT,
  LOG_METRICS,
  MONITORING_VIOLATION_LOGS,
  POLICIES,
  applicationLogFilter,
  buildLogMatchPolicy,
  logMatchPolicyIsCurrent
} from '../scripts/configure-functions-gen2-g1-monitoring.mjs';

const CHANNELS = [
  'projects/secondevienextjsssr/notificationChannels/primary',
  'projects/secondevienextjsssr/notificationChannels/secondary'
];

test('la réparation installe les protections avant de retirer les tâches futures du backlog', () => {
  const policies = buildMaintenanceMonitoring({ channels: CHANNELS.slice(1), subscriptions: ['actual-subscription'] }).policies
    .filter(p => !p.displayName.endsWith('Retard de tâche'));
  policies.push({ name: 'projects/secondevienextjsssr/alertPolicies/1',
    displayName: 'G1 Sandbox - Cloud Tasks backlog', enabled: true, notificationChannels: CHANNELS,
    conditions: [{ conditionThreshold: { filter: 'metric.type="cloudtasks.googleapis.com/queue/depth"', duration: '300s' } }] });
  const before = structuredClone(policies);
  const repairs = planAlertRepair(policies);
  assert.deepEqual(policies, before);
  assert.equal(repairs.length, 6);
  const backlog = repairs.at(-1).next;
  assert.equal(backlog.conditions[0].conditionThreshold.filter, BACKLOG_FILTER);
  assert.equal(backlog.conditions[0].conditionThreshold.duration, '300s');
  assert.ok(!BACKLOG_FILTER.includes('dispatchCatalogBuild'));
  for (const queue of DEFERRED_QUEUES) {
    assert.ok(BACKLOG_FILTER.includes(`queue_id!="${queue}"`));
    for (const { next } of repairs.slice(0, 3)) assert.ok(next.conditions[0].conditionThreshold.filter.includes(`queue_id="${queue}"`));
    assert.ok(repairs[4].next.conditions[0].conditionMatchedLog.filter.includes(`/queues/${queue}"`));
  }
  const delay = repairs.find(p => p.next.displayName.endsWith('Retard de tâche'));
  assert.equal(delay.current, undefined);
  assert.equal(delay.next.conditions[0].conditionThreshold.thresholdValue, 300000);
  for (const { next } of repairs) assert.deepEqual([...next.notificationChannels].sort(), [...CHANNELS].sort());
  assert.throws(() => planAlertRepair([]), /BACKLOG_POLICY_UNEXPECTED/);
  assert.throws(() => planAlertRepair([before.at(-1)]), /subscription IDs required/);
});

test('les metriques commerce ne peuvent pas compter les journaux de leurs propres incidents', () => {
  for (const message of ['commerce_worker_incomplete', 'commerce_health_unhealthy']) {
    const filter = applicationLogFilter(message);
    assert.match(filter, new RegExp(`jsonPayload\\.message="${message}"`));
    assert.match(filter, new RegExp(`textPayload:"${message}"`));
    for (const logName of MONITORING_VIOLATION_LOGS) {
      assert.match(filter, new RegExp(`logName!="${logName.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}"`));
    }
    assert.doesNotMatch(filter, new RegExp(`resource\\.type="cloud_function" "${message}"`));
  }

  const filters = new Map(LOG_METRICS.map((metric) => [metric.name, metric.filter]));
  assert.equal(filters.get('secondevie_commerce_worker_incomplete'), applicationLogFilter('commerce_worker_incomplete'));
  assert.equal(filters.get('secondevie_commerce_health_unhealthy'), applicationLogFilter('commerce_health_unhealthy'));
});

test('les alertes applicatives sont directes, severisees et limitees a une notification par cinq minutes', () => {
  const definitions = POLICIES.filter((policy) => policy.logMatchFilter);
  assert.equal(definitions.length, 4);

  for (const definition of definitions) {
    const policy = buildLogMatchPolicy(definition, CHANNELS);
    assert.equal(policy.conditions.length, 1);
    assert.equal(policy.conditions[0].conditionMatchedLog.filter, definition.logMatchFilter);
    assert.equal(policy.alertStrategy.notificationRateLimit.period, '300s');
    assert.equal(policy.alertStrategy.autoClose, '21600s');
    assert.deepEqual(policy.alertStrategy.notificationPrompts, ['OPENED']);
    assert.ok(['ERROR', 'WARNING'].includes(policy.severity));
    assert.deepEqual(policy.notificationChannels, CHANNELS);
    assert.equal(logMatchPolicyIsCurrent(policy, definition, [...CHANNELS].reverse()), true);
  }

  assert.equal(LOG_ALERT_RATE_LIMIT, '300s');
  assert.equal(LOG_ALERT_AUTO_CLOSE, '21600s');
});

test('chaque policy porte une severite exploitable', () => {
  assert.equal(POLICIES.length, 10);
  for (const definition of POLICIES) {
    assert.ok(['ERROR', 'WARNING'].includes(definition.severity), definition.displayName);
  }
});

test('le canal secondaire PubSub reste le comportement par defaut du script', () => {
  assert.equal(DEFAULT_SECONDARY_SOURCE, 'pubsub');
});

test('un drift de filtre, strategie, severite ou canal force une mise a jour', () => {
  const definition = POLICIES.find((policy) => policy.displayName.includes('worker incomplete'));
  const current = buildLogMatchPolicy(definition, CHANNELS, 'projects/test/alertPolicies/1');

  assert.equal(logMatchPolicyIsCurrent({ ...current, severity: 'WARNING' }, definition, CHANNELS), false);
  assert.equal(logMatchPolicyIsCurrent({
    ...current,
    alertStrategy: { ...current.alertStrategy, autoClose: '60s' }
  }, definition, CHANNELS), false);
  assert.equal(logMatchPolicyIsCurrent({
    ...current,
    conditions: [{
      ...current.conditions[0],
      conditionMatchedLog: { filter: 'resource.type="cloud_function"' }
    }]
  }, definition, CHANNELS), false);
  assert.equal(logMatchPolicyIsCurrent(current, definition, CHANNELS.slice(0, 1)), false);
});
