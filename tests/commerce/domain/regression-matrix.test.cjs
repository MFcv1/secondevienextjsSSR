'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('pre-correction NC-001..NC-007 evidence maps only to green regression proofs', () => {
    const matrix = JSON.parse(fs.readFileSync(
        path.join(__dirname, '..', 'fixtures', 'gate1-regression-matrix.json'),
        'utf8'
    ));
    assert.equal(matrix.capturedBeforeCorrection, true);
    assert.deepEqual(
        matrix.cases.map((entry) => entry.finding),
        ['NC-001', 'NC-002', 'NC-003', 'NC-004', 'NC-005', 'NC-006', 'NC-007']
    );
    for (const entry of matrix.cases) {
        assert.ok(entry.beforeFailure.length > 20);
        assert.match(entry.regressionProof, /^[a-z0-9-]+$/);
        assert.equal(Object.hasOwn(entry, 'expectedFailure'), false);
        assert.equal(Object.hasOwn(entry, 'xfail'), false);
    }
});
