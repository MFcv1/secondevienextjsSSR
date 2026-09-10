'use strict';
const PROJECT = 'secondevienextjsssr';
const PREFIX = 'Seconde Vie - Événements - ';
const types = {
    'Livraison de tâche refusée': 'TASK_DELIVERY_FAILED',
    'Création de tâche refusée': 'TASK_ENQUEUE_FAILED',
    'Retard de tâche': 'TASK_DELIVERY_LATE',
    'Événement non acquitté': 'EVENT_DELIVERY_LATE',
    'Queue interrompue': 'TASK_QUEUE_INTERRUPTED'
};
// Project only the five transport policies, never provider summaries or arbitrary
// notification contents. Closed alerts do not add a new error occurrence.
function maintenanceAlertEntry(message) {
    const incident = message?.incident;
    if (incident?.scoping_project_id !== PROJECT || incident.state !== 'open'
        || typeof incident.policy_name !== 'string' || !incident.policy_name.startsWith(PREFIX)) return null;
    const title = incident.policy_name.slice(PREFIX.length);
    if (!Object.hasOwn(types, title)) return null;
    const errorClass = types[title];
    const time = Number(incident.started_at) * 1000;
    if (!errorClass || !Number.isSafeInteger(time) || time <= 0
        || !/^[A-Za-z0-9_.-]{1,160}$/.test(incident.incident_id || '')) return null;
    const labels = incident.resource?.labels || {};
    const service = [labels.queue_id, labels.subscription_id].find(value => /^[A-Za-z0-9_-]{1,160}$/.test(value || '')) || 'maintenance-transport';
    return { insertId: incident.incident_id, timestamp: new Date(time).toISOString(), severity: 'CRITICAL',
        logName: `projects/${PROJECT}/logs/monitoring.googleapis.com%2FViolationOpenEventv1`,
        resource: { type: incident.resource?.type || 'global', labels: { project_id: PROJECT } },
        jsonPayload: { service, event: 'maintenance_transport_alert', errorClass,
            message: title, expected: false, correlationId: incident.incident_id } };
}
module.exports = { maintenanceAlertEntry };
