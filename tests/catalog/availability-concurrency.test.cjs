'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { projectAvailability } = require('../../functions/src/catalog/availability');

test('catalogue evidence reads overlap within a fixed bound and preserve source order', async () => {
    let active = 0;
    let peak = 0;
    let reads = 0;
    const db = { collection: () => ({ where: (_field, _operator, id) => ({ limit: count => ({ get: async () => {
        assert.equal(count, 51);
        reads++;
        peak = Math.max(peak, ++active);
        await new Promise(resolve => setImmediate(resolve));
        active--;
        return { docs: [{ data: () => ({ collectionName: 'furniture', committedQty: Number(id) % 2, heldQty: 0 }) }] };
    } }) }) }) };
    const sources = Array.from({ length: 25 }, (_, index) => ({ id: String(index), data: { status: 'published', stock: 0 } }));
    sources.push({ id: 'in-stock', data: { status: 'published', stock: 1 } });
    const result = await projectAvailability(db, sources);
    assert.equal(reads, 25);
    assert.ok(peak > 1 && peak <= 8);
    assert.deepEqual(result.map(item => item.id), sources.map(item => item.id));
    assert.equal(result[1].data.availability, 'sold');
    assert.equal(result[2].data.availability, 'unavailable');
    assert.equal(result.at(-1).data.availability, 'available');
});
