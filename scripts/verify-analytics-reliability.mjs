import assert from 'node:assert/strict';
import ipTools from '../functions/src/analytics/ip.js';
import sessionSecurity from '../functions/src/analytics/sessionSecurity.js';
import {
    ANALYTICS_TIME_FILTERS,
    buildVisitorDayGroups,
    buildAnalyticsStats,
    buildVisitorConfidence,
    getFilteredTrafficSessions,
    getReliableVisitorKey,
    isUsableAnalyticsIp,
    maskAnalyticsIp,
    normalizeSessionDuration
} from '../src/kit/admin/analyticsReliability.js';

const baseNow = Date.UTC(2026, 4, 7, 12, 0, 0);
const ts = (offsetMs) => ({ seconds: Math.floor((baseNow + offsetMs) / 1000) });
const syncToken = 'session-proof-token';
const syncTokenHash = sessionSecurity.hashSyncToken(syncToken);

const sameIpSessions = [
    { id: 's1', startedAt: ts(-60 * 60 * 1000), type: 'anonymous', ip: '203.0.113.10', duration: 30 },
    { id: 's2', startedAt: ts(-30 * 60 * 1000), type: 'anonymous', ip: '203.0.113.10', duration: 20 }
];

let result = buildAnalyticsStats(sameIpSessions, '1j', { now: baseNow });
assert.equal(result.kpis.totalSessions, 2);
assert.equal(result.kpis.uniqueVisitors, 1);
assert.equal(result.kpis.uniqueIps, 1);

const sameUidDifferentIps = [
    { id: 's3', userId: 'anon-1', authProvider: 'anonymous', startedAt: ts(-2 * 60 * 60 * 1000), type: 'anonymous', ip: '203.0.113.10', duration: 20 },
    { id: 's4', userId: 'anon-1', authProvider: 'anonymous', startedAt: ts(-1 * 60 * 60 * 1000), type: 'anonymous', ip: '198.51.100.20', duration: 40 }
];

result = buildAnalyticsStats(sameUidDifferentIps, '1j', { now: baseNow });
assert.equal(result.kpis.totalSessions, 2);
assert.equal(result.kpis.uniqueVisitors, 1);
assert.equal(result.kpis.uniqueIps, 2);
assert.equal(getReliableVisitorKey(sameUidDifferentIps[0]), 'uid:anon-1');

const unknownIp = [
    { id: 's5', startedAt: ts(-10 * 60 * 1000), type: 'anonymous', ip: 'Unknown', duration: 12 }
];

result = buildAnalyticsStats(unknownIp, '1j', { now: baseNow });
assert.equal(result.kpis.uniqueIps, 0);
assert.equal(result.kpis.ipCoverage, 0);
assert.equal(result.dataQuality.missingIpSessions, 1);
assert.equal(isUsableAnalyticsIp('Unknown'), false);
assert.equal(result.dataQuality.confidence, 'faible');

const slotDedup = [
    { id: 's6', userId: 'anon-2', authProvider: 'anonymous', startedAt: ts(-15 * 60 * 1000), type: 'anonymous', ip: '203.0.113.30', duration: 30 },
    { id: 's7', userId: 'anon-2', authProvider: 'anonymous', startedAt: ts(-10 * 60 * 1000), type: 'anonymous', ip: '203.0.113.30', duration: 30 }
];

result = buildAnalyticsStats(slotDedup, '1j', { now: baseNow });
const activeSlots = result.chartData.filter(slot => slot.sessions > 0);
assert.equal(activeSlots.length, 1);
assert.equal(activeSlots[0].sessions, 2);
assert.equal(activeSlots[0].visites, 1);

const misalignedNow = Date.UTC(2026, 4, 7, 20, 32, 0);
const comptoirSessionAt = Date.UTC(2026, 4, 7, 20, 12, 0);
result = buildAnalyticsStats([
    { id: 'aligned-hour', startedAt: { seconds: Math.floor(comptoirSessionAt / 1000) }, type: 'anonymous', ip: '203.0.113.31', duration: 30 }
], '1j', { now: misalignedNow });
const misalignedActiveSlot = result.chartData.find(slot => slot.sessions > 0);
assert.equal(misalignedActiveSlot.name, `${new Date(comptoirSessionAt).getHours()}h`, '1j chart labels use the real hour bucket, not the sliding-window cutoff hour');

const metricSessions = [
    { id: 'm1', startedAt: ts(-50 * 60 * 1000), type: 'anonymous', ip: '203.0.113.50', duration: 20, journey: [], device: 'Mobile' },
    { id: 'm2', startedAt: ts(-40 * 60 * 1000), type: 'anonymous', ip: '203.0.113.51', duration: 40, journey: [{ page: 'home' }, { page: 'gallery' }], device: 'Desktop' },
    { id: 'm3', startedAt: ts(-30 * 60 * 1000), type: 'anonymous', ip: '203.0.113.52', duration: -10, journey: [{ page: 'home' }, { page: 'gallery' }], device: 'Desktop' }
];

result = buildAnalyticsStats(metricSessions, '1h', { now: baseNow });
assert.equal(result.kpis.totalSessions, 3);
assert.equal(result.kpis.avgDuration, 20);
assert.equal(result.kpis.bounceRate, 67);
assert.equal(result.kpis.mobilePercentage, 33);
assert.equal(normalizeSessionDuration(-1), 0);
assert.equal(normalizeSessionDuration(999999), 24 * 60 * 60);

for (const filter of ANALYTICS_TIME_FILTERS.filter(({ id }) => id !== 'tout')) {
    const inside = {
        id: `inside-${filter.id}`,
        startedAt: { seconds: Math.floor((baseNow - filter.duration + 60 * 1000) / 1000) },
        type: 'anonymous',
        ip: `203.0.113.${filter.id.length + 60}`,
        duration: 15,
        journey: [{ page: 'home' }, { page: 'gallery' }]
    };
    const outside = {
        id: `outside-${filter.id}`,
        startedAt: { seconds: Math.floor((baseNow - filter.duration - 60 * 1000) / 1000) },
        type: 'anonymous',
        ip: `203.0.113.${filter.id.length + 80}`,
        duration: 15,
        journey: [{ page: 'home' }, { page: 'gallery' }]
    };
    const exactlyNow = {
        id: `now-${filter.id}`,
        startedAt: { seconds: Math.floor(baseNow / 1000) },
        type: 'anonymous',
        ip: `203.0.113.${filter.id.length + 90}`,
        duration: 15,
        journey: [{ page: 'home' }, { page: 'gallery' }]
    };

    result = buildAnalyticsStats([inside, outside, exactlyNow], filter.id, { now: baseNow });
    assert.equal(result.kpis.totalSessions, 1, `${filter.id} keeps only the in-window session`);
    const expectedSlotCount = Math.ceil(filter.duration / filter.step);
    assert.ok(
        result.chartData.length >= expectedSlotCount && result.chartData.length <= expectedSlotCount + 1,
        `${filter.id} has stable slot count with at most one partial aligned edge slot`
    );
    assert.equal(result.chartData.reduce((sum, slot) => sum + slot.sessions, 0), 1, `${filter.id} chart sessions match KPI`);
}

result = buildAnalyticsStats(sameIpSessions, 'tout', { now: baseNow });
assert.equal(result.kpis.totalSessions, 2, 'tout keeps the complete supplied history');

result = buildAnalyticsStats(sameIpSessions, '1j', {
    now: baseNow,
    fetchedCount: 1000,
    maxFetched: 1000,
    coverageStartMs: baseNow - 60 * 60 * 1000
});
assert.equal(result.dataQuality.isWindowComplete, false);
assert.equal(result.dataQuality.confidence, 'plafonnee');

const visitorGroups = buildVisitorDayGroups(getFilteredTrafficSessions(slotDedup, '1j', { now: baseNow }), { now: baseNow });
assert.equal(visitorGroups.length, 1);
assert.equal(visitorGroups[0].sessionCount, 2);
assert.equal(visitorGroups[0].visitors.length, 1);
assert.equal(visitorGroups[0].visitors[0].sessionCount, 2);
assert.equal(visitorGroups[0].visitors[0].journeySteps, 0);
assert.equal(visitorGroups[0].visitors[0].ipLabel, '203.0.x.x');
assert.equal(maskAnalyticsIp('2001:861:50:1090:44ee:1330:2c05:4928'), '2001:861:50:1090:...');

const dashboardConsistencySessions = [
    { id: 'dc1', userId: 'anon-a', authProvider: 'anonymous', startedAt: ts(-3 * 60 * 60 * 1000), type: 'anonymous', ip: '203.0.113.70', duration: 30 },
    { id: 'dc2', userId: 'anon-a', authProvider: 'anonymous', startedAt: ts(-2 * 60 * 60 * 1000), type: 'anonymous', ip: '203.0.113.70', duration: 45 },
    { id: 'dc3', userId: 'anon-b', authProvider: 'anonymous', startedAt: ts(-30 * 60 * 1000), type: 'anonymous', ip: '203.0.113.71', duration: 20 },
    { id: 'dc4', userId: 'admin-user', startedAt: ts(-20 * 60 * 1000), type: 'admin', ip: '203.0.113.72', duration: 99 },
    { id: 'dc5', userId: 'outside', startedAt: ts(-25 * 60 * 60 * 1000), type: 'anonymous', ip: '203.0.113.73', duration: 99 }
];
result = buildAnalyticsStats(dashboardConsistencySessions, '1j', { now: baseNow });
const filteredForDashboard = getFilteredTrafficSessions(dashboardConsistencySessions, '1j', { now: baseNow });
const groupedForDashboard = buildVisitorDayGroups(filteredForDashboard, { now: baseNow });
const groupedVisitorKeys = new Set(groupedForDashboard.flatMap(day => day.visitors.map(visitor => visitor.key)));
assert.equal(filteredForDashboard.length, result.kpis.totalSessions, 'dashboard list session source matches KPI sessions');
assert.equal(groupedForDashboard.reduce((sum, day) => sum + day.sessionCount, 0), result.kpis.totalSessions, 'grouped day session counts match KPI sessions');
assert.equal(groupedVisitorKeys.size, result.kpis.uniqueVisitors, 'unique visitor rectangles match KPI unique visitors');
assert.equal(result.chartData.reduce((sum, slot) => sum + slot.sessions, 0), result.kpis.totalSessions, 'bar chart session sum matches KPI sessions');
assert.equal(result.kpis.uniqueVisitors, 2);
assert.equal(result.kpis.visitorIpRatioLabel, '1.00');
assert.equal(result.kpis.visitorConfidenceScore, 100);
assert.equal(result.chartData.reduce((sum, slot) => sum + slot.visites, 0), 3, 'bar chart visitors are deduped per slot, not globally');

const closeUidIpConfidence = buildVisitorConfidence({
    uniqueVisitors: 59,
    uniqueIps: 49,
    ipCoverage: 100,
    sessionFallbackCount: 0,
    isWindowComplete: true
});
assert.equal(closeUidIpConfidence.ratioLabel, '1.20');
assert.equal(closeUidIpConfidence.score, 90);
assert.equal(closeUidIpConfidence.label, 'forte');

const weakUidIpConfidence = buildVisitorConfidence({
    uniqueVisitors: 200,
    uniqueIps: 20,
    ipCoverage: 100,
    sessionFallbackCount: 0,
    isWindowComplete: true
});
assert.equal(weakUidIpConfidence.score, 0);
assert.equal(weakUidIpConfidence.label, 'faible');

assert.equal(ipTools.normalizeIp('::ffff:203.0.113.42'), '203.0.113.42');
assert.equal(ipTools.normalizeIp('203.0.113.42:443'), '203.0.113.42');
assert.deepEqual(
    ipTools.getClientIpInfo({
        headers: { 'x-forwarded-for': '198.51.100.1, 10.0.0.1' },
        connection: { remoteAddress: '10.0.0.2' }
    }).ip,
    '198.51.100.1'
);

assert.equal(sessionSecurity.isValidSyncToken({}, null), true, 'sync keeps legacy session compatibility');
assert.equal(sessionSecurity.isValidSyncToken({ syncTokenHash }, syncToken), true);
assert.equal(sessionSecurity.isValidSyncToken({ syncTokenHash }, 'wrong-token'), false);
assert.equal(
    sessionSecurity.canResumeSession({
        userId: 'anon-secure',
        type: 'anonymous',
        syncTokenHash,
        lastActivityAt: ts(-5 * 60 * 1000)
    }, { authUid: 'anon-secure', syncToken, now: baseNow }),
    true,
    'resume accepts matching UID, token hash and recent activity'
);
assert.equal(
    sessionSecurity.canResumeSession({
        userId: 'anon-secure',
        type: 'anonymous',
        sessionActive: false,
        syncTokenHash,
        lastActivityAt: ts(-10 * 1000)
    }, { authUid: 'anon-secure', syncToken, now: baseNow }),
    true,
    'resume tolerates an immediate reload after a close beacon'
);
assert.equal(
    sessionSecurity.canResumeSession({
        userId: 'anon-secure',
        type: 'anonymous',
        sessionActive: false,
        syncTokenHash,
        lastActivityAt: ts(-5 * 60 * 1000)
    }, { authUid: 'anon-secure', syncToken, now: baseNow }),
    false,
    'resume creates a new session when a closed browser returns minutes later'
);
assert.equal(
    sessionSecurity.canResumeSession({
        userId: 'anon-secure',
        type: 'anonymous',
        lastActivityAt: ts(-5 * 60 * 1000)
    }, { authUid: 'anon-secure', syncToken, now: baseNow }),
    false,
    'resume rejects legacy sessions without token hash'
);
assert.equal(
    sessionSecurity.canResumeSession({
        userId: 'anon-secure',
        type: 'anonymous',
        syncTokenHash,
        lastActivityAt: ts(-5 * 60 * 1000)
    }, { authUid: 'other-user', syncToken, now: baseNow }),
    false,
    'resume rejects UID mismatch'
);
assert.equal(
    sessionSecurity.canResumeSession({
        userId: 'anon-secure',
        type: 'admin',
        syncTokenHash,
        lastActivityAt: ts(-5 * 60 * 1000)
    }, { authUid: 'anon-secure', syncToken, now: baseNow }),
    false,
    'resume rejects admin sessions'
);
assert.equal(
    sessionSecurity.canResumeSession({
        userId: 'anon-secure',
        type: 'anonymous',
        syncTokenHash,
        lastActivityAt: ts(-59 * 60 * 1000)
    }, { authUid: 'anon-secure', syncToken, now: baseNow }),
    true,
    'resume accepts same visitor activity inside one hour'
);
assert.equal(
    sessionSecurity.canResumeSession({
        userId: 'anon-secure',
        type: 'anonymous',
        syncTokenHash,
        lastActivityAt: ts(-61 * 60 * 1000)
    }, { authUid: 'anon-secure', syncToken, now: baseNow }),
    false,
    'resume rejects stale sessions'
);

console.log('Analytics reliability verifier passed.');
