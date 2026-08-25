'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    ORDER_REFERENCE_UNAVAILABLE,
    formatOrderReference,
    getOrderReference,
    parseOrderReference
} = require('../shared/orderReference.cjs');
const functionsOrderReference = require('../functions/src/shared/orderReference.cjs');

test('formats canonical human order references', () => {
    assert.equal(formatOrderReference(1), 'C1');
    assert.equal(formatOrderReference(132), 'C132');
    assert.equal(getOrderReference({ id: 'ord_opaque', orderNumber: 132 }), 'C132');
});

test('never promotes an opaque technical ID to the human reference', () => {
    assert.equal(formatOrderReference(0), ORDER_REFERENCE_UNAVAILABLE);
    assert.equal(formatOrderReference(-1), ORDER_REFERENCE_UNAVAILABLE);
    assert.equal(formatOrderReference(1.5), ORDER_REFERENCE_UNAVAILABLE);
    assert.equal(formatOrderReference('132'), ORDER_REFERENCE_UNAVAILABLE);
    assert.equal(formatOrderReference(Number.MAX_SAFE_INTEGER + 1), ORDER_REFERENCE_UNAVAILABLE);
    assert.equal(getOrderReference({ id: 'ord_opaque' }), ORDER_REFERENCE_UNAVAILABLE);
});

test('parses current, case-insensitive, bare and legacy references', () => {
    for (const value of ['C132', 'c132', '132', 'CMD-132', 'cmd-132']) {
        assert.equal(parseOrderReference(value), 132);
    }
    for (const value of ['', 'C0', 'CMD--132', 'ord_opaque', 'C1.5']) {
        assert.equal(parseOrderReference(value), null);
    }
});

test('frontend and Functions deployment packages expose the same contract', () => {
    for (const value of [132, 0, null, '132']) {
        assert.equal(functionsOrderReference.formatOrderReference(value), formatOrderReference(value));
    }
    for (const value of ['C132', 'c132', '132', 'CMD-132', 'cmd-132', 'ord_opaque']) {
        assert.equal(functionsOrderReference.parseOrderReference(value), parseOrderReference(value));
    }
});
