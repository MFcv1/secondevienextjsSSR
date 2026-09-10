'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { appendOccurrence, windowOccurrences, MAX_OCCURRENCES } = require('../functions/helpers/incidentWindows.cjs');
const HOUR = 3600000, END = Date.parse('2026-09-10T12:00:00Z');
test('all five rolling windows count occurrences, never lifetime totals', () => {
    const group = { occurrenceTimes: [END - 168 * HOUR, END - 72 * HOUR, END - 24 * HOUR, END - 6 * HOUR, END - HOUR, END], occurrenceCount: 900, windowCoverageStart: END - 200 * HOUR };
    for (const [hours, count] of [[1, 1], [6, 2], [24, 3], [72, 4], [168, 5]]) assert.deepEqual(windowOccurrences(group, END - hours * HOUR, END), { count, complete: true });
});
test('late logs sorted and bounded; truncation and legacy never pretend completeness', () => {
    let group = { occurrenceTimes: [], windowCoverageStart: END - 10000 };
    for (let i = 0; i < MAX_OCCURRENCES + 1; i++) group = appendOccurrence(group, END - i, END);
    assert.equal(group.occurrenceTimes.length, MAX_OCCURRENCES);
    assert.equal(windowOccurrences(group, END - HOUR, END + 1).complete, false);
    assert.deepEqual(windowOccurrences({ occurrenceCount: 900 }, END - HOUR, END), { count: null, complete: false });
});
test('the UI imports the exact same counting contract as the projector', () => {
    assert.equal(require('../shared/incidentWindows.cjs').windowOccurrences, windowOccurrences);
});
