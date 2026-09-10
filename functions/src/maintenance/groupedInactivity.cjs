'use strict';
const { createHash } = require('node:crypto');
const { intent, sessionIntent } = require('./durableWork.cjs');
const { millis } = require('./activityMaintenanceCore.cjs');
const COLLECTION = 'analytics_inactivity_groups';
const WINDOW_MS = 5 * 60000;
const INACTIVITY_MS = 35 * 60000;
const PAGE_SIZE = 100;
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const validId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(id);

function configuration(env = process.env) {
    const mode = env.ANALYTICS_INACTIVITY_MODE || 'individual';
    const partitions = Number(env.ANALYTICS_INACTIVITY_PARTITIONS || 4);
    if (!['individual', 'grouped'].includes(mode) || ![1, 4, 16].includes(partitions)) throw Error('INACTIVITY_CONFIG_INVALID');
    return { mode, partitions };
}
function groupFor(sessionId, eligibleAt, now, partitions = 4) {
    if (!validId(sessionId) || !Number.isSafeInteger(eligibleAt) || !Number.isSafeInteger(now)
        || ![1, 4, 16].includes(partitions)) throw Error('INACTIVITY_GROUP_INVALID');
    // Late enrollment uses a future, still-open bucket; never append behind a cursor.
    const due = Math.ceil(Math.max(eligibleAt, now + 1) / WINDOW_MS) * WINDOW_MS;
    const shard = parseInt(hash(sessionId).slice(0, 8), 16) % partitions;
    return { id: `v1_${partitions}_${due}_${shard}`, due, partitions };
}

// Caller has read its session first. All enrollment reads precede any writes.
async function enroll(tx, db, sessionId, generation, eligibleAt, now, partitions) {
    const group = groupFor(sessionId, eligibleAt, now, partitions);
    const ref = db.doc(`${COLLECTION}/${group.id}`), snapshot = await tx.get(ref);
    const existing = snapshot.data();
    if (existing && (existing.sealed || existing.due !== group.due || existing.partitions !== partitions)) throw Error('INACTIVITY_GROUP_SEALED');
    if (!existing) tx.create(ref, { schemaVersion: 1, ...group, sealed: false,
        maintenanceWork: intent('sessionGroup', group.id, group.due) });
    // Membership is the session's indexed pointer, committed by the caller in
    // this transaction. No duplicate member documents or per-visitor counters.
    return { mode: 'grouped', groupId: group.id, generation, partitions };
}

async function trackingPatch(tx, db, id, current, active, now, config = configuration()) {
    if (current?.type === 'admin') return {};
    const grouped = current?.inactivityGroup?.mode === 'grouped'
        || (!current?.maintenanceWork && config.mode === 'grouped');
    if (!grouped) {
        if (active) return sessionIntent(current, now, id);
        return current?.maintenanceWork ? { maintenanceWork: { ...current.maintenanceWork,
            state: 'succeeded', result: 'session_closed', lease: null, leaseUntil: null, completedAt: now } } : {};
    }
    if (!active || (current?.sessionActive && current.inactivityGroup?.mode === 'grouped')) return {};
    const generation = hash([id, now, current?.inactivityGroup?.generation || null]);
    const pointer = await enroll(tx, db, id, generation, now + INACTIVITY_MS, now,
        current?.inactivityGroup?.partitions || config.partitions);
    return { inactivityGroup: pointer };
}

function assertLease(group, request, now) {
    const work = group?.maintenanceWork;
    if (!request.workLease || work?.lease !== request.workLease || work.state !== 'running'
        || work.version !== request.data.version || work.generation !== request.data.generation
        || work.leaseUntil <= now) throw Error('INACTIVITY_GROUP_LEASE_LOST');
}
async function migrationPatch(tx, db, id, current, direction, now, partitions = 4) {
    if (!['grouped', 'individual'].includes(direction)) throw Error('INACTIVITY_MIGRATION_INVALID');
    if (!current?.sessionActive || current.type === 'admin') return null;
    const grouped = current.inactivityGroup?.mode === 'grouped';
    if ((direction === 'grouped') === grouped) return null;
    const last = Math.ceil(millis(current.lastActivityAt));
    if (!Number.isSafeInteger(last)) throw Error('INACTIVITY_SESSION_TIME_INVALID');
    const generation = hash([id, now, current.inactivityGroup?.generation || null, current.maintenanceWork?.version || null]);
    if (direction === 'individual') return {
        inactivityGroup: { mode: 'individual', generation },
        maintenanceWork: intent('session', id, Math.max(now, last + INACTIVITY_MS), generation)
    };
    const pointer = await enroll(tx, db, id, generation, last + INACTIVITY_MS, now, partitions);
    return { inactivityGroup: pointer, ...(current.maintenanceWork ? { maintenanceWork: {
        ...current.maintenanceWork, state: 'superseded', lease: null, leaseUntil: null,
        result: 'grouped_owner', completedAt: now
    } } : {}) };
}
function createGroupedInactivity({ db, now = Date.now, serverTimestamp = () => new Date(now()), pageSize = PAGE_SIZE }) {
    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > PAGE_SIZE) throw Error('INACTIVITY_PAGE_INVALID');
    async function dispatch(request) {
        if (request.data?.kind !== 'sessionGroup' || !validId(request.data.id)) throw Error('INACTIVITY_TASK_INVALID');
        const ref = db.doc(`${COLLECTION}/${request.data.id}`);
        await db.runTransaction(async tx => {
            const group = (await tx.get(ref)).data(); assertLease(group, request, now());
            if (!group.sealed) tx.update(ref, { sealed: true });
        });
        const members = db.collection('analytics_sessions').where('sessionActive', '==', true)
            .where('inactivityGroup.groupId', '==', ref.id);
        const page = await members.limit(pageSize).get();
        const counts = { finalized: 0, moved: 0, stale: 0 };
        for (const member of page.docs) {
            const outcome = await db.runTransaction(async tx => {
                const [groupSnap, snapshot] = await Promise.all([tx.get(ref), tx.get(member.ref)]);
                assertLease(groupSnap.data(), request, now());
                const sessionRef = member.ref;
                const session = snapshot.data(), pointer = session?.inactivityGroup;
                if (!session || !session.sessionActive || pointer?.mode !== 'grouped' || pointer.groupId !== ref.id) return 'stale';
                if (!/^[a-f0-9]{64}$/.test(pointer.generation || '')) throw Error('INACTIVITY_MEMBER_INVALID');
                const exclusion = await tx.get(db.doc(`analytics_session_exclusions/${member.id}`));
                if (session.type === 'admin' || exclusion.exists) {
                    tx.update(sessionRef, { inactivityGroup: { ...pointer, groupId: null, excluded: true } });
                    return 'stale';
                }
                const last = Math.ceil(millis(session.lastActivityAt));
                if (!Number.isSafeInteger(last)) throw Error('INACTIVITY_SESSION_TIME_INVALID');
                const time = now(), eligibleAt = last + INACTIVITY_MS;
                if (eligibleAt > time) {
                    const next = await enroll(tx, db, member.id, pointer.generation, eligibleAt, time, pointer.partitions);
                    tx.update(sessionRef, { inactivityGroup: next });
                    return 'moved';
                }
                tx.update(sessionRef, { sessionActive: false, finalizedBy: 'inactivity_group', finalizedAt: serverTimestamp() });
                return 'finalized';
            });
            counts[outcome]++;
        }
        // Sealed membership + atomic closure/movement make replay restart-safe:
        // the next page is the first remaining page, with no cursor that can skip a failure.
        const complete = await db.runTransaction(async tx => {
            const [group, remaining] = await Promise.all([tx.get(ref), tx.get(members.limit(1))]);
            assertLease(group.data(), request, now());
            if (!remaining.empty) return false;
            return true;
        });
        return { outcome: complete ? 'group_completed' : 'page_completed', ...counts,
            ...(complete ? {} : { due: now() + 1000 }) };
    }
    return { dispatch };
}
module.exports = { COLLECTION, WINDOW_MS, INACTIVITY_MS, PAGE_SIZE, groupFor, configuration, enroll, trackingPatch, migrationPatch, createGroupedInactivity };
