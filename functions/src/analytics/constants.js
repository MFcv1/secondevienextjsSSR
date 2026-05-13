const admin = require('firebase-admin');

const DAY_MS = 24 * 60 * 60 * 1000;

const ANALYTICS_DETAIL_RETENTION_DAYS = 90;
const ANALYTICS_SESSION_RETENTION_DAYS = 366;
const ANALYTICS_ROLLUP_RETENTION_DAYS = 366;
const SYSTEM_DOC_RETENTION_DAYS = 30;

function timestampFromNow(days) {
    return admin.firestore.Timestamp.fromMillis(Date.now() + (days * DAY_MS));
}

function getDateKeyFromMillis(value) {
    const millis = typeof value === 'number' ? value : Date.now();
    return new Date(millis).toISOString().split('T')[0];
}

function getDateKeyFromTimestamp(value) {
    if (!value) return getDateKeyFromMillis(Date.now());
    if (typeof value.toMillis === 'function') {
        return getDateKeyFromMillis(value.toMillis());
    }
    if (typeof value.seconds === 'number') {
        return getDateKeyFromMillis(value.seconds * 1000);
    }
    if (typeof value === 'number') {
        return getDateKeyFromMillis(value);
    }
    return getDateKeyFromMillis(Date.now());
}

module.exports = {
    DAY_MS,
    ANALYTICS_DETAIL_RETENTION_DAYS,
    ANALYTICS_SESSION_RETENTION_DAYS,
    ANALYTICS_ROLLUP_RETENTION_DAYS,
    SYSTEM_DOC_RETENTION_DAYS,
    timestampFromNow,
    getDateKeyFromMillis,
    getDateKeyFromTimestamp
};
