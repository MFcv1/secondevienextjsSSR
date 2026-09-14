// These queues deliberately hold future work. Their transport alerts must be
// installed before excluding them from the generic immediate-work backlog.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { taskNames } = require('../../functions/src/maintenance/scheduleActivity.cjs');
export const DEFERRED_QUEUES = Object.freeze(Object.values(taskNames)
  .filter(name => name !== 'dispatchPublicationCheckGen2').sort());
export const BACKLOG_FILTER = 'metric.type="cloudtasks.googleapis.com/queue/depth" AND resource.type="cloud_tasks_queue"'
  + DEFERRED_QUEUES.map(name => ` AND resource.labels.queue_id!="${name}"`).join('');
