import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { buildMaintenanceMonitoring } from './event-maintenance-monitoring.mjs';
import { BACKLOG_FILTER } from './lib/deferred-queue-alerts.mjs';

const PROJECT = 'secondevienextjsssr';
const BACKLOG = 'G1 Sandbox - Cloud Tasks backlog';
export function planAlertRepair(policies) {
  const backlog = policies.find(p => p.displayName === BACKLOG);
  if (!backlog?.enabled || backlog.conditions?.length !== 1
    || !backlog.conditions[0].conditionThreshold?.filter.includes('cloudtasks.googleapis.com/queue/depth')
    || !backlog.notificationChannels?.length) throw Error('BACKLOG_POLICY_UNEXPECTED');
  const events = policies.find(p => p.displayName === 'Seconde Vie - Événements - Événement non acquitté');
  const subscriptions = [...(events?.conditions?.[0]?.conditionThreshold?.filter || '')
    .matchAll(/resource.labels.subscription_id="([A-Za-z0-9_-]+)"/g)].map(m => m[1]);
  const desired = buildMaintenanceMonitoring({ channels: backlog.notificationChannels, subscriptions }).policies;
  const repairs = desired.map(definition => {
    const current = policies.find(p => p.displayName === definition.displayName);
    // Keep existing IDs, labels and destinations; use the canonical transport
    // conditions so a missing or drifted protection cannot be silently accepted.
    const next = { ...current, ...definition,
      notificationChannels: [...new Set([...(current?.notificationChannels || []), ...definition.notificationChannels])],
      conditions: definition.conditions.map((condition, i) => ({ ...condition,
        ...(current?.conditions?.[i]?.name ? { name: current.conditions[i].name } : {}) })) };
    delete next.creationRecord;
    delete next.mutationRecord;
    return { current, next };
  });
  const next = structuredClone(backlog);
  delete next.creationRecord;
  delete next.mutationRecord;
  next.conditions[0].conditionThreshold.filter = BACKLOG_FILTER;
  next.conditions[0].displayName = 'Travail immédiat en attente pendant 5 minutes';
  repairs.push({ current: backlog, next }); // Always last: establish coverage first.
  return repairs;
}

function main() {
  const flags = process.argv.slice(2);
  if (!flags.includes(`--project=${PROJECT}`) || !flags.includes('--env=sandbox')) throw Error('SANDBOX_REQUIRED');
  const apply = flags.includes('--apply');
  const directory = flags.find(f => f.startsWith('--out='))?.slice(6);
  if (!directory) throw Error('BACKUP_DIRECTORY_REQUIRED');
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const cloud = args => JSON.parse(execFileSync('gcloud', [...args, `--project=${PROJECT}`, '--format=json'], { encoding: 'utf8' }));
  const policies = cloud(['monitoring', 'policies', 'list']);
  const repairs = planAlertRepair(policies);
  fs.writeFileSync(path.join(directory, 'before.json'), JSON.stringify(policies, null, 2), { mode: 0o600, flag: 'wx' });
  for (const [index, { current, next }] of repairs.entries()) {
    const file = path.resolve(directory, `policy-${index}.json`);
    fs.writeFileSync(file, JSON.stringify(next, null, 2), { mode: 0o600 });
    if (apply) {
      const result = cloud(['monitoring', 'policies', current ? 'update' : 'create',
        ...(current ? [current.name] : []), `--policy-from-file=${file}`]);
      const actual = cloud(['monitoring', 'policies', 'describe', result.name]);
      if (!actual.enabled || actual.notificationChannels?.length !== next.notificationChannels.length
        || next.notificationChannels.some(c => !actual.notificationChannels.includes(c))) throw Error('CHANNEL_READBACK_FAILED');
      const stripNames = conditions => conditions.map(({ name: _name, ...condition }) => condition);
      // Provider may omit a zero threshold; normalize both representations.
      const normalized = conditions => stripNames(conditions).map(c => c.conditionThreshold
        ? { ...c, conditionThreshold: { ...c.conditionThreshold, thresholdValue: c.conditionThreshold.thresholdValue || 0 } } : c);
      const canonical = value => JSON.stringify(value, function (_key, item) {
        return item && !Array.isArray(item) && typeof item === 'object'
          ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item;
      });
      if (canonical(normalized(actual.conditions)) !== canonical(normalized(next.conditions))) throw Error('CONDITION_READBACK_FAILED');
    }
    console.log(`${apply ? 'VERIFIED' : 'PLAN'} ${next.displayName}`);
  }
  if (apply) fs.writeFileSync(path.join(directory, 'after.json'), JSON.stringify(cloud(['monitoring', 'policies', 'list']), null, 2), { mode: 0o600 });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
