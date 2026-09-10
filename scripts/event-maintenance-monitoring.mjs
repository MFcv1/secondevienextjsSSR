import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { taskNames } = require('../functions/src/maintenance/scheduleActivity.cjs');
const PROJECT = 'secondevienextjsssr';

// Generates reviewable Cloud Monitoring policies. It never installs them implicitly.
export function buildMaintenanceMonitoring({ channels, subscriptions }) {
    if (!Array.isArray(channels) || !channels.length || channels.some(id => !new RegExp(`^projects/${PROJECT}/notificationChannels/[A-Za-z0-9_-]+$`).test(id))) throw Error('Verified notification channels required');
    if (!Array.isArray(subscriptions) || !subscriptions.length || subscriptions.some(id => !/^[A-Za-z0-9_-]+$/.test(id))) throw Error('Actual Eventarc subscription IDs required');
    const base = { enabled: true, combiner: 'OR', notificationChannels: channels,
        documentation: { mimeType: 'text/markdown', content: 'Runbook: _DOCS/infra/FIABILITE_EVENEMENTS.md. Inspecter le transport puis reprendre les intentions ciblées avec scripts/repair-event-maintenance.mjs. Ne jamais rejouer un paiement ambigu.' } };
    const metricPolicy = (name, filter, aligner, threshold, duration = '0s') => ({ ...base,
        displayName: `Seconde Vie - Événements - ${name}`, conditions: [{ displayName: name, conditionThreshold: {
            filter, comparison: 'COMPARISON_GT', thresholdValue: threshold, duration,
            aggregations: [{ alignmentPeriod: '300s', perSeriesAligner: aligner }], trigger: { count: 1 }
        } }] });
    const queues = Object.values(taskNames).filter(name => name !== 'dispatchPublicationCheckGen2');
    const scope = `resource.type="cloud_tasks_queue" AND (${queues.map(id => `resource.labels.queue_id="${id}"`).join(' OR ')})`;
    const policies = [
        metricPolicy('Livraison de tâche refusée', `${scope} AND metric.type="cloudtasks.googleapis.com/queue/task_attempt_count" AND metric.labels.response_code!="ok"`, 'ALIGN_SUM', 0),
        metricPolicy('Création de tâche refusée', `${scope} AND metric.type="cloudtasks.googleapis.com/api/request_count" AND metric.labels.api_method="CreateTask" AND metric.labels.response_code!="ok" AND metric.labels.response_code!="already_exists"`, 'ALIGN_SUM', 0),
        metricPolicy('Retard de tâche', `${scope} AND metric.type="cloudtasks.googleapis.com/queue/task_attempt_delays"`, 'ALIGN_PERCENTILE_99', 300000),
        metricPolicy('Événement non acquitté', `resource.type="pubsub_subscription" AND metric.type="pubsub.googleapis.com/subscription/oldest_unacked_message_age" AND (${subscriptions.map(id => `resource.labels.subscription_id="${id}"`).join(' OR ')})`, 'ALIGN_MAX', 600),
        { ...base, displayName: 'Seconde Vie - Événements - Queue interrompue', conditions: [{ displayName: 'Queue suspendue, supprimée ou purgée', conditionMatchedLog: {
            labelExtractors: { queue: 'EXTRACT(protoPayload.resourceName)' },
            filter: `protoPayload.serviceName="cloudtasks.googleapis.com" AND protoPayload.methodName=("google.cloud.tasks.v2.CloudTasks.PauseQueue" OR "google.cloud.tasks.v2.CloudTasks.DeleteQueue" OR "google.cloud.tasks.v2.CloudTasks.PurgeQueue") AND (${queues.map(id => `protoPayload.resourceName="projects/${PROJECT}/locations/europe-west1/queues/${id}"`).join(' OR ')})`
        } }], alertStrategy: { notificationRateLimit: { period: '300s' }, autoClose: '86400s' } }
    ];
    return { project: PROJECT, status: 'POLICIES_TO_INSTALL_AND_EXERCISE', policies,
        limitations: ['Une profondeur positive inclut les tâches futures et ne prouve pas un retard.', 'Le retard de dispatch ne voit pas une queue qui ne distribue jamais ; tester aussi le signal de suspension.', 'La notification et la reprise doivent être exercées avant retrait des schedulers.'] };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const flags = process.argv.slice(2);
    const values = prefix => flags.filter(value => value.startsWith(prefix)).map(value => value.slice(prefix.length));
    process.stdout.write(JSON.stringify(buildMaintenanceMonitoring({ channels: values('--channel='), subscriptions: values('--subscription=') }), null, 2) + '\n');
}
