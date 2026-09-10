'use strict';
// Transactional unit-test store, NOT an emulator or a cloud performance model.
function createMemory() {
    const records = new Map(), metrics = { reads: 0, writes: 0, transactions: 0, queries: 0, documentEvents: {} };
    let tail = Promise.resolve(), rejectCommit = false;
    const clone = value => value === undefined ? undefined : structuredClone(value);
    const snapshot = path => ({ id: path.split('/').at(-1), ref: doc(path), exists: records.has(path), data: () => clone(records.get(path)) });
    const read = ref => {
        if (ref.isQuery) {
            metrics.queries++;
            const paths = [...records.keys()].filter(p => p.startsWith(ref.path + '/') && !p.slice(ref.path.length + 1).includes('/')
                && ref.filters.every(([field, value]) => field.split('.').reduce((data, key) => data?.[key], records.get(p)) === value)).sort().slice(0, ref.count);
            metrics.reads += Math.max(1, paths.length);
            return { docs: paths.map(snapshot), size: paths.length, empty: !paths.length };
        }
        metrics.reads++; return snapshot(ref.path);
    };
    const query = (path, count = Infinity, filters = []) => ({ path, count, filters, isQuery: true,
        where: (field, op, value) => { if (op !== '==') throw Error('UNSUPPORTED_QUERY'); return query(path, count, [...filters, [field, value]]); },
        limit: n => query(path, n, filters), get: async () => read(query(path, count, filters)) });
    const doc = path => ({ path, id: path.split('/').at(-1), get: async () => read({ path }), collection: name => ({ ...query(`${path}/${name}`), doc: id => doc(`${path}/${name}/${id}`) }) });
    const db = { doc, collection: path => query(path), runTransaction: callback => {
        const result = tail.then(async () => {
            metrics.transactions++;
            const writes = [];
            const value = await callback({
                get: async ref => { if (writes.length) throw Error('READ_AFTER_WRITE'); return read(ref); },
                create: (ref, data) => { if (records.has(ref.path)) throw Error('ALREADY_EXISTS'); writes.push([ref.path, data]); },
                set: (ref, data, options) => writes.push([ref.path, options?.merge ? { ...records.get(ref.path), ...data } : data]),
                update: (ref, data) => { if (!records.has(ref.path)) throw Error('MISSING'); writes.push([ref.path, { ...records.get(ref.path), ...data }]); },
                delete: ref => writes.push([ref.path, undefined])
            });
            if (rejectCommit) { rejectCommit = false; throw Error('ABORTED_COMMIT'); }
            for (const [path, data] of writes) {
                metrics.writes++;
                const collection = path.split('/').slice(-2)[0];
                metrics.documentEvents[collection] = (metrics.documentEvents[collection] || 0) + 1;
                if (data === undefined) records.delete(path); else records.set(path, clone(data));
            }
            return value;
        });
        tail = result.catch(() => {}); return result;
    } };
    return { db, records, metrics, rejectCommit: () => { rejectCommit = true; } };
}
module.exports = { createMemory };
