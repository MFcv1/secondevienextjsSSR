const crypto = require('crypto');

const HLL_PRECISION = 12;
const HLL_REGISTERS = 1 << HLL_PRECISION;
const PAGE_EVENTS = new Set([
    'page_view', 'gallery_view', 'category_view', 'product_view',
    'wishlist_view', 'quote_view', 'checkout_view', 'account_orders_view'
]);

function hashHex(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function emptyHll() {
    return { precision: HLL_PRECISION, registers: Array(HLL_REGISTERS).fill(0) };
}

function addHll(source, value) {
    const hll = source?.precision === HLL_PRECISION && Array.isArray(source.registers)
        ? { precision: HLL_PRECISION, registers: source.registers.slice(0, HLL_REGISTERS) }
        : emptyHll();
    while (hll.registers.length < HLL_REGISTERS) hll.registers.push(0);
    const bits = BigInt(`0x${hashHex(value).slice(0, 16)}`);
    const index = Number(bits >> BigInt(64 - HLL_PRECISION));
    const remainder = BigInt.asUintN(64 - HLL_PRECISION, bits);
    const width = 64 - HLL_PRECISION;
    let rank = 1;
    for (let bit = width - 1; bit >= 0 && ((remainder >> BigInt(bit)) & 1n) === 0n; bit -= 1) rank += 1;
    hll.registers[index] = Math.max(hll.registers[index] || 0, rank);
    return hll;
}

function mergeHll(values) {
    const result = emptyHll();
    for (const value of values || []) {
        if (!value || value.precision !== HLL_PRECISION || !Array.isArray(value.registers)) continue;
        for (let i = 0; i < HLL_REGISTERS; i += 1) result.registers[i] = Math.max(result.registers[i], Number(value.registers[i]) || 0);
    }
    return result;
}

function estimateHll(hll) {
    const registers = hll?.registers || [];
    const m = HLL_REGISTERS;
    const alpha = 0.7213 / (1 + 1.079 / m);
    const sum = registers.reduce((total, value) => total + (2 ** -(Number(value) || 0)), 0);
    let estimate = alpha * m * m / Math.max(sum, Number.EPSILON);
    const zeros = registers.filter((value) => !value).length;
    if (estimate <= 2.5 * m && zeros > 0) estimate = m * Math.log(m / zeros);
    return Math.round(estimate);
}

function incrementMap(target, key, amount = 1) {
    if (!key) return;
    target[key] = (target[key] || 0) + amount;
}

function buildContribution(events, root) {
    const ordered = [...events].sort((a, b) => Number(a.seq) - Number(b.seq));
    const pages = {};
    const actions = {};
    const transitions = {};
    let previousRoute = null;
    for (const event of ordered) {
        if (PAGE_EVENTS.has(event.eventName)) {
            incrementMap(pages, event.routeKey || 'unknown');
            if (previousRoute && previousRoute !== event.routeKey) incrementMap(transitions, `${previousRoute}__${event.routeKey || 'unknown'}`);
            previousRoute = event.routeKey || 'unknown';
        } else {
            incrementMap(actions, event.eventName);
        }
    }
    const outcome = actions.checkout_start ? 'checkout_started'
        : (actions.quote_email_intent ? 'quote_intent' : (actions.cart_add ? 'cart_added' : null));
    return {
        sessions: 1,
        pageViews: Object.values(pages).reduce((sum, value) => sum + value, 0),
        events: ordered.length,
        activeDurationMs: Math.max(0, Number(root.activeDurationMs) || 0),
        pages,
        actions,
        transitions,
        outcomes: outcome ? { [outcome]: 1 } : {},
        identity: { [root.identitySource || 'fallback_session']: 1 },
        completeness: {
            complete_sequence: Number(root.dataQuality?.sequenceGaps || 0) === 0 ? 1 : 0,
            sequence_gap: Number(root.dataQuality?.sequenceGaps || 0) > 0 ? 1 : 0
        },
        integrity: {
            app_check_observed: root.dataQuality?.appCheckObserved === true ? 1 : 0,
            schema_valid: root.dataQuality?.schemaValid !== false ? 1 : 0
        },
        mode: root.measurementMode,
        outcome
    };
}

function diffMap(after = {}, before = {}) {
    const result = {};
    for (const key of new Set([...Object.keys(after), ...Object.keys(before)])) {
        const delta = Number(after[key] || 0) - Number(before[key] || 0);
        if (delta) result[key] = delta;
    }
    return result;
}

function diffContribution(after, before = {}) {
    return {
        sessions: Number(after.sessions || 0) - Number(before.sessions || 0),
        pageViews: Number(after.pageViews || 0) - Number(before.pageViews || 0),
        events: Number(after.events || 0) - Number(before.events || 0),
        activeDurationMs: Number(after.activeDurationMs || 0) - Number(before.activeDurationMs || 0),
        pages: diffMap(after.pages, before.pages),
        actions: diffMap(after.actions, before.actions),
        transitions: diffMap(after.transitions, before.transitions),
        outcomes: diffMap(after.outcomes, before.outcomes),
        identity: diffMap(after.identity, before.identity),
        completeness: diffMap(after.completeness, before.completeness),
        integrity: diffMap(after.integrity, before.integrity)
    };
}

function contributionHash(value) {
    return hashHex(JSON.stringify(value));
}

function shardFor(value, shardCount) {
    return parseInt(hashHex(value).slice(0, 8), 16) % shardCount;
}

module.exports = {
    HLL_PRECISION,
    addHll,
    buildContribution,
    contributionHash,
    diffContribution,
    emptyHll,
    estimateHll,
    mergeHll,
    shardFor
};
