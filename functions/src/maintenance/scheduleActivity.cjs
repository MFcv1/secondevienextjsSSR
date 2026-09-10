'use strict';
const { getFunctions } = require('firebase-admin/functions');
const { createActivityMaintenance, planWrite } = require('./activityMaintenanceCore.cjs');
const taskNames = { link: 'dispatchPaymentLinkExpiryGen2', publication: 'dispatchPublicationCheckGen2', session: 'dispatchAnalyticsInactivityGen2', sessionGroup: 'dispatchAnalyticsInactivityGroupGen2', compaction: 'dispatchAnalyticsCompactionGen2', archive: 'dispatchAnalyticsArchiveGen2', inbox: 'dispatchInboxCheckGen2', payment: 'dispatchPaymentCheckGen2' };
async function scheduleActivity(plan) {
    if (process.env.ACTIVITY_MAINTENANCE_ENABLED !== 'true' || !plan) return { outcome: 'ignored' };
    return createActivityMaintenance({
        enqueue: (kind, data, config) => getFunctions().taskQueue(`locations/europe-west1/functions/${taskNames[kind]}`).enqueue(data, config)
    }).schedule(plan);
}
async function scheduleSessionActivity(id, before, after) {
    if (after?.inactivityGroup?.mode === 'grouped') return;
    if (process.env.ACTIVITY_MAINTENANCE_ENABLED !== 'true') return;
    if (after?.maintenanceWork) {
        const work = after.maintenanceWork;
        if (work.state !== 'pending' || (work.version === before?.maintenanceWork?.version
            && work.generation === before?.maintenanceWork?.generation && before?.maintenanceWork?.state === 'pending')) return;
        return require('./durableWork.cjs').createDurableWork({
            db: require('firebase-admin').firestore(),
            enqueue: (kind, data, config) => getFunctions().taskQueue(`locations/europe-west1/functions/${taskNames[kind]}`).enqueue(data, config)
        }).schedule(work);
    }
    return scheduleActivity(planWrite('session', id, before, after));
}
module.exports = { scheduleActivity, scheduleSessionActivity, taskNames };
